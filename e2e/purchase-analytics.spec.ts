import { expect, test, type Browser, type BrowserContext, type Page, type Request } from "@playwright/test";
import { BASE_URL, uniqueName } from "./helpers";

// Run only against the isolated fake-payment environment. Production canCount requires HTTPS and SITE_URL equality.
// APP_URL and NEXT_PUBLIC_SITE_URL must both match E2E_BASE_URL; HTTP cannot exercise SDK readiness honestly.
test.skip(!BASE_URL.startsWith("https://"), "Purchase analytics requires the local HTTPS environment with matching SITE_URL");

const ORIGIN = new URL(BASE_URL).origin;
const UUID = /^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i;
const CLAIM_PATH = "/api/analytics/purchases";
const BIRTH = { birthDate: "1990-03-07", time: "12:00", name: "Москва", latitude: 55.7558, longitude: 37.6173, zone: "Europe/Moscow" };
const PAID_GOALS = ["report_paid", "lila_paid", "natal_paid"];
type Product = "matrix_report" | "lila_session" | "natal_report";
type GoalCall = { goal: string; params?: unknown };
type Purchase = { ecommerce: { currencyCode: string; purchase: { actionField: { id: string; revenue: number }; products: { id: Product; name: string; price: number; quantity: number }[] } } };
type Claim = { ok: boolean; events: { transactionId: string; product: Product; amountKopecks: number }[] };
type QaWindow = Window & { dataLayer?: Purchase[]; __qaMetrikaCallbacks?: unknown[]; __qaReleaseMetrika?: () => void };

// Official contracts: https://yandex.ru/support/metrica/ru/objects/get-client-id
// and https://yandex.ru/support/metrica/ru/ecommerce/data. Hold getClientID callbacks until the test releases SDK readiness.
const SDK = `(() => {
  const queued = window.ym?.a ?? [];
  const callbacks = [];
  window.__qaMetrikaCallbacks = callbacks;
  window.__qaReleaseMetrika = () => callbacks.splice(0).forEach(callback => callback("local-qa-client"));
  window.ym = (_id, method, ...args) => {
    if (method === "getClientID" && typeof args[0] === "function") callbacks.push(args[0]);
    if (method === "reachGoal") {
      const calls = JSON.parse(sessionStorage.getItem("qa-purchase-goals") ?? "[]");
      calls.push({ goal: args[0], params: args[1] });
      sessionStorage.setItem("qa-purchase-goals", JSON.stringify(calls));
      if (typeof args[2] === "function") setTimeout(args[2], 0);
    }
  };
  for (const args of queued) window.ym(...args);
})();`;

async function harness(browser: Browser, { cookies = [], choice = "necessary" }: { cookies?: Awaited<ReturnType<BrowserContext["cookies"]>>; choice?: "necessary" | null } = {}) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    storageState: { cookies, origins: choice ? [{ origin: ORIGIN, localStorage: [{ name: "oracle-cookie-consent", value: choice }] }] : [] },
  });
  const claims: Request[] = [];
  let tags = 0;
  // No Yandex request leaves the browser. Only tag.js receives an in-memory SDK; all transports abort.
  await context.route("https://mc.yandex.ru/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/metrika/tag.js") {
      tags += 1;
      await route.fulfill({ status: 200, contentType: "application/javascript", body: SDK });
    } else await route.abort();
  });
  context.on("request", (request) => { if (new URL(request.url()).pathname === CLAIM_PATH) claims.push(request); });
  const page = await context.newPage();
  return { context, page, claims, tags: () => tags };
}

async function login(page: Page, name = uniqueName("Покупки QA")) {
  await page.goto(`/api/dev/login?name=${encodeURIComponent(name)}`);
  await expect(page).toHaveURL(/\/portret$/);
}

async function saveDate(page: Page, birthDate = "1988-11-18") {
  const response = await page.request.post("/api/profile/birth-date", { headers: { origin: ORIGIN }, data: { birthDate } });
  expect(response.ok()).toBe(true);
}

async function createPurchase(page: Page, product: Product) {
  const response = await page.request.post("/api/purchases", {
    headers: { origin: ORIGIN },
    data: { product, email: "purchase-qa@example.test", ...(product === "lila_session" ? { intention: "Как выбрать следующий шаг в работе?" } : {}), ...(product === "natal_report" ? { birth: BIRTH } : {}) },
  });
  expect(response.status()).toBe(200);
  const body = await response.json() as { ok: boolean; url: string };
  expect(body.ok).toBe(true);
  return new URL(body.url, BASE_URL);
}

async function pay(page: Page, product: Product, rubles: number) {
  const url = await createPurchase(page, product);
  expect(url.origin).toBe(ORIGIN);
  expect(url.pathname).toMatch(/^\/dev\/pay\//);
  await page.goto(url.toString());
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${rubles} ₽`);
  const completed = page.waitForResponse((response) => new URL(response.url()).pathname.startsWith("/api/dev/pay/") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Оплатить", exact: true }).click();
  const redirect = (await completed).headers()["location"];
  expect(redirect).toBeTruthy();
  const purchaseId = new URL(redirect!, BASE_URL).pathname.split("/").pop()!;
  expect(purchaseId).toMatch(UUID);
  await expect(page).toHaveURL(product === "lila_session" ? /\/lila\/igra$/ : /\/portret\/razbor\/[\da-f-]{36}$/);
  return purchaseId;
}

const purchases = (page: Page): Promise<Purchase[]> => page.evaluate(() => ((window as QaWindow).dataLayer ?? []).filter((entry) => entry.ecommerce?.purchase));
const goals = (page: Page): Promise<GoalCall[]> => page.evaluate(() => JSON.parse(sessionStorage.getItem("qa-purchase-goals") ?? "[]"));
const paidGoals = async (page: Page) => (await goals(page)).filter(({ goal }) => PAID_GOALS.includes(goal));

async function accept(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Cookie", exact: true });
  // The payment redirect can expose the SSR footer before Analytics installs its event listener.
  // Wait for the actual user-visible effect, retrying an early click as other hydration-sensitive e2e flows do.
  await expect(async () => {
    if (!(await dialog.isVisible())) await page.getByRole("button", { name: "Настройки cookie", exact: true }).click({ timeout: 2000 });
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 25_000 });
  await dialog.getByRole("button", { name: "Принять", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as QaWindow).__qaMetrikaCallbacks?.length ?? 0)).toBeGreaterThan(0);
}

async function releaseSdk(page: Page): Promise<Claim> {
  await expect.poll(() => page.evaluate(() => (window as QaWindow).__qaMetrikaCallbacks?.length ?? 0)).toBeGreaterThan(0);
  const response = page.waitForResponse((value) => new URL(value.url()).pathname === CLAIM_PATH && value.request().method() === "POST");
  await page.evaluate(() => (window as QaWindow).__qaReleaseMetrika!());
  const result = await response;
  expect(result.status()).toBe(200);
  expect(result.headers()["cache-control"]).toBe("no-store");
  return result.json();
}

async function expectSale(page: Page, product: Product, rubles: number, purchaseId: string, goal: string, claim: Claim) {
  expect(claim.ok).toBe(true);
  expect(claim.events).toHaveLength(1);
  const transactionId = claim.events[0]!.transactionId;
  expect(transactionId).toMatch(UUID);
  expect(transactionId).not.toBe(purchaseId);
  expect(claim.events).toEqual([{ transactionId, product, amountKopecks: rubles * 100 }]);
  await expect.poll(() => purchases(page)).toHaveLength(1);
  const emitted = await purchases(page);
  expect(emitted).toEqual([{ ecommerce: { currencyCode: "RUB", purchase: { actionField: { id: transactionId, revenue: rubles }, products: [{ id: product, name: expect.any(String), price: rubles, quantity: 1 }] } } }]);
  await expect.poll(() => paidGoals(page)).toEqual([{ goal }]);
  // No email, birth date, location or original purchase ID goes into the sale payload.
  for (const secret of [purchaseId, "purchase-qa@example.test", BIRTH.birthDate, BIRTH.name]) expect(JSON.stringify([emitted, await paidGoals(page)])).not.toContain(secret);
}

test("late consent and SDK readiness send matrix revenue once across reload and a fresh browser context", async ({ browser }) => {
  test.setTimeout(150_000);
  const qa = await harness(browser);
  try {
    await login(qa.page);
    await saveDate(qa.page);
    const purchaseId = await pay(qa.page, "matrix_report", 390);
    const reportUrl = qa.page.url();
    // The previous implementation lost purchases after its ten-second retry window.
    await qa.page.waitForTimeout(11_000);
    await expect(qa.page.getByRole("heading", { level: 1 })).toHaveText("Ваш центр — Сила", { timeout: 60_000 });
    expect(qa.tags()).toBe(0);
    expect(qa.claims).toHaveLength(0);
    expect(await purchases(qa.page)).toEqual([]);
    expect(await paidGoals(qa.page)).toEqual([]);

    await accept(qa.page);
    expect(qa.tags()).toBe(1);
    expect(qa.claims).toHaveLength(0);
    expect(await purchases(qa.page)).toEqual([]);
    expect(await paidGoals(qa.page)).toEqual([]);
    expect((await goals(qa.page)).filter(({ goal }) => goal === "report_opened")).toEqual([]);
    await expectSale(qa.page, "matrix_report", 390, purchaseId, "report_paid", await releaseSdk(qa.page));
    await expect.poll(() => goals(qa.page)).toContainEqual({ goal: "report_opened" });
    await qa.page.goto("/portret");
    await qa.page.goto(reportUrl);
    expect(await releaseSdk(qa.page)).toEqual({ ok: true, events: [] });
    expect(await purchases(qa.page)).toEqual([]);
    expect(await paidGoals(qa.page)).toEqual([{ goal: "report_paid" }]);
    await qa.page.reload();
    expect(await releaseSdk(qa.page)).toEqual({ ok: true, events: [] });
    expect(await purchases(qa.page)).toEqual([]);
    expect(await paidGoals(qa.page)).toEqual([{ goal: "report_paid" }]);

    // Carry only the authenticated session cookies: neither consent nor any local deduplication state survives.
    const fresh = await harness(browser, { cookies: (await qa.context.cookies()).filter(({ name }) => name === "oracle_session"), choice: null });
    try {
      await fresh.page.goto(reportUrl);
      expect(await fresh.page.evaluate(() => localStorage.length)).toBe(0);
      await accept(fresh.page);
      expect(await releaseSdk(fresh.page)).toEqual({ ok: true, events: [] });
      expect(await purchases(fresh.page)).toEqual([]);
      expect(await paidGoals(fresh.page)).toEqual([]);
    } finally { await fresh.context.close(); }
  } finally { await qa.context.close(); }
});

for (const scenario of [{ product: "lila_session", goal: "lila_paid" }, { product: "natal_report", goal: "natal_paid" }] as const) {
  test(`${scenario.product} sends its actual 490 RUB amount after SDK readiness`, async ({ browser }) => {
    test.setTimeout(120_000);
    const qa = await harness(browser);
    try {
      await login(qa.page);
      const purchaseId = await pay(qa.page, scenario.product, 490);
      expect(qa.claims).toHaveLength(0);
      await accept(qa.page);
      expect(qa.claims).toHaveLength(0);
      await expectSale(qa.page, scenario.product, 490, purchaseId, scenario.goal, await releaseSdk(qa.page));
      if (scenario.product === "natal_report") {
        await expect(qa.page.getByRole("heading", { level: 1 })).toHaveText("Разбор натальной карты", { timeout: 60_000 });
        await expect.poll(() => goals(qa.page)).toContainEqual({ goal: "natal_report_opened" });
      }
    } finally { await qa.context.close(); }
  });
}

test("the owner's free report is excluded even with consent and a ready SDK", async ({ browser }) => {
  const qa = await harness(browser);
  try {
    await login(qa.page, process.env.E2E_OWNER_NAME ?? "Владелица");
    // Change the saved date between reruns so the existing-owner duplicate guard does not short-circuit this case.
    const seed = Math.floor(Date.now() / 1000) % (100 * 12 * 28);
    await saveDate(qa.page, `${1900 + Math.floor(seed / (12 * 28))}-${String(Math.floor(seed / 28) % 12 + 1).padStart(2, "0")}-${String(seed % 28 + 1).padStart(2, "0")}`);
    const url = await createPurchase(qa.page, "matrix_report");
    // A free owner purchase skips the gateway entirely; a wrongly configured OWNER_VK_ID fails here.
    expect(url.pathname).toMatch(/^\/portret\/razbor\/[\da-f-]{36}$/);
    await qa.page.goto(url.toString());
    await accept(qa.page);
    expect(await releaseSdk(qa.page)).toEqual({ ok: true, events: [] });
    expect(await purchases(qa.page)).toEqual([]);
    expect(await paidGoals(qa.page)).toEqual([]);
  } finally { await qa.context.close(); }
});
