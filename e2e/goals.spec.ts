import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

// Цели Метрики (apps/web/src/lib/analytics.ts). Локально счётчик не грузится, поэтому подставляем свой window.ym и записываем
// вызовы в sessionStorage: так они переживают переход на страницу входа. Нужен dev:web; платные блоки — PAID_REPORTS=on, PAID_LILA=on
type Call = { goal: string; hasParams: boolean; params?: Record<string, string> };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { ym: (id: number, method: string, goal?: string, params?: unknown) => void }).ym = (_id, method, goal, params) => {
      if (method !== "reachGoal") return;
      const calls = JSON.parse(sessionStorage.getItem("test-goals") ?? "[]");
      calls.push({ goal, hasParams: params !== undefined, params: params as Record<string, string> | undefined });
      sessionStorage.setItem("test-goals", JSON.stringify(calls));
    };
  });
});

const goals = async (page: Page): Promise<Call[]> => page.evaluate(() => JSON.parse(sessionStorage.getItem("test-goals") ?? "[]"));
const names = async (page: Page) => (await goals(page)).map((call) => call.goal);

async function scrollThrough(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
}

test("the matrix funnel fires its goals, and none of them carries any data", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await expect(async () => {
    await page.getByRole("textbox", { name: "Дата рождения" }).fill("1988-11-18");
    await page.getByRole("button", { name: "Рассчитать матрицу", exact: true }).first().click();
    await expect(page.locator("#report-offer-title")).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 25_000 });
  await scrollThrough(page, "#report-offer-title");
  await expect.poll(() => names(page)).toEqual(expect.arrayContaining(["matrix_calculated", "report_offer_view"]));

  await page.getByRole("link", { name: /Войти и купить разбор/ }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(await names(page)).toContain("report_offer_click");
  // Цели — только названия: ни даты рождения, ни почты, ни текста в параметрах
  expect((await goals(page)).every((call) => !call.hasParams)).toBe(true);
});

test("the compatibility funnel has its own offer goals", async ({ page }) => {
  await page.goto("/sovmestimost");
  await expect(async () => {
    await page.getByLabel("Ваша дата рождения").fill("1988-11-18");
    await page.getByLabel("Дата рождения партнёра").fill("2000-01-01");
    await page.getByRole("button", { name: "Рассчитать совместимость" }).click();
    await expect(page.locator("#report-offer-title")).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 25_000 });
  await scrollThrough(page, "#report-offer-title");
  await expect.poll(() => names(page)).toEqual(expect.arrayContaining(["compat_calculated", "compat_offer_view"]));

  await page.getByRole("link", { name: /Войти и купить разбор/ }).click();
  await expect(page).toHaveURL(/\/login/);
  const fired = await names(page);
  expect(fired).toContain("compat_offer_click");
  // Предложение под совместимостью не засчитывается как предложение под матрицей
  expect(fired).not.toContain("report_offer_view");
  expect(fired).not.toContain("report_offer_click");
  expect((await goals(page)).every((call) => !call.hasParams)).toBe(true);
});

test("drawing a card and starting a Lila game fire their goals", async ({ page }) => {
  await page.goto("/taro/karta-dnya");
  await expect(async () => {
    await page.getByRole("button", { name: "Карта 2" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Как прожить день" })).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 25_000 });
  expect(await names(page)).toContain("taro_draw");

  await page.goto("/lila/igra");
  await page.getByRole("textbox", { name: "Ваше намерение" }).fill("Почему мне трудно принять решение о работе?");
  await page.getByRole("button", { name: /^Играть/ }).click();
  await expect(page.locator(".game-intention")).toBeVisible();
  expect(await names(page)).toContain("lila_start");
  expect((await goals(page)).every((call) => !call.hasParams)).toBe(true);
});

test("a guest viewing the guide offer and heading to login fires two Lila offer goals without data", async ({ page }) => {
  await page.goto("/lila/igra");
  await scrollThrough(page, "#lila-offer-title");
  await expect.poll(async () => names(page)).toContain("lila_offer_view");

  await page.getByRole("link", { name: "Войти и начать с проводником" }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(await names(page)).toContain("lila_login_click");
  expect((await goals(page)).every((call) => !call.hasParams)).toBe(true);
});

test("buying the guide fires redirect and sale goals once, and the only parameter is the product", async ({ browser }) => {
  test.setTimeout(120_000);
  const { context, page } = await signIn(browser, uniqueName("Метрика"));
  await page.addInitScript(() => {
    (window as unknown as { ym: (id: number, method: string, goal?: string, params?: unknown) => void }).ym = (_id, method, goal, params) => {
      if (method !== "reachGoal") return;
      const calls = JSON.parse(sessionStorage.getItem("test-goals") ?? "[]");
      calls.push({ goal, hasParams: params !== undefined, params });
      sessionStorage.setItem("test-goals", JSON.stringify(calls));
    };
  });
  await page.goto("/lila/igra");
  await page.getByRole("textbox", { name: "Ваше намерение" }).fill("Почему мне трудно принять решение о работе?");
  await page.getByRole("textbox", { name: "E-mail для чека" }).fill("test@example.ru");
  await page.getByRole("button", { name: "Начать с проводником — 490 ₽" }).click();
  await expect(page).toHaveURL(/\/dev\/pay\//);
  const redirect = (await goals(page)).find((call) => call.goal === "checkout_redirect");
  expect(redirect?.params).toEqual({ product: "lila" });

  await page.getByRole("button", { name: "Оплатить" }).click();
  await expect(page).toHaveURL(/\/lila\/igra$/, { timeout: 30_000 });
  const fired = await names(page);
  expect(fired.filter((goal) => goal === "lila_paid")).toHaveLength(1);
  expect(fired).toContain("lila_offer_click");
  await context.close();
});
