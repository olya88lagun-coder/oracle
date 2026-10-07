import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, signIn, uniqueName } from "./helpers";

// Нужны PAYMENTS=fake, PAID_REPORTS=on, PAID_LILA=on, DEV_LOGIN=1 и OWNER_VK_ID=dev-Владелица (см. .env.development.example)
const OWNER_NAME = "Владелица";
const DATE = "1990-03-07";

async function saveDate(page: Page, iso: string) {
  const response = await page.request.post("/api/profile/birth-date", { data: { birthDate: iso }, headers: { origin: BASE_URL } });
  expect(response.ok()).toBe(true);
}

test("the receipts page is a plain 404 for guests and for ordinary users", async ({ browser, page }) => {
  expect((await page.goto("/admin/receipts"))?.status()).toBe(404);

  const { context, page: user } = await signIn(browser, uniqueName("Покупатель"));
  expect((await user.goto("/admin/receipts"))?.status()).toBe(404);
  await context.close();
});

test("a paid purchase shows up for the owner with its e-mail, and «Чек отправлен» removes it", async ({ browser }) => {
  const email = `receipt-${Date.now()}@example.ru`;
  const { context: buyerContext, page: buyer } = await signIn(browser, uniqueName("Платящий"));
  await saveDate(buyer, DATE);
  const purchase = await buyer.request.post("/api/purchases", { data: { email }, headers: { origin: BASE_URL } });
  const { url } = (await purchase.json()) as { url: string };
  await buyer.goto(url);
  await buyer.getByRole("button", { name: "Оплатить" }).click();
  await expect(buyer).toHaveURL(/\/portret\/razbor\//);
  await buyerContext.close();

  const { context, page } = await signIn(browser, OWNER_NAME);
  await page.goto("/admin/receipts");
  await expect(page.getByRole("heading", { level: 1, name: "Чеки к отправке" })).toBeVisible();
  const item = page.getByRole("listitem").filter({ hasText: email });
  await expect(item).toContainText("Разбор матрицы судьбы");
  await expect(item).toContainText("390 ₽");

  await item.getByRole("button", { name: "Чек отправлен" }).click();
  await expect(page.getByText(email)).toHaveCount(0);
  await context.close();
});

test("the receipts page counts what is waiting, says for how long and copies the lines for the tax app", async ({ browser }) => {
  const email = `copy-${Date.now()}@example.ru`;
  const { context: buyerContext, page: buyer } = await signIn(browser, uniqueName("Копирующий"));
  await saveDate(buyer, DATE);
  const purchase = await buyer.request.post("/api/purchases", { data: { email }, headers: { origin: BASE_URL } });
  const { url } = (await purchase.json()) as { url: string };
  await buyer.goto(url);
  await buyer.getByRole("button", { name: "Оплатить" }).click();
  await expect(buyer).toHaveURL(/\/portret\/razbor\//);
  await buyerContext.close();

  const { context, page } = await signIn(browser, OWNER_NAME);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE_URL });
  await page.goto("/admin/receipts");
  await expect(page.getByRole("status")).toContainText(/К отправке: \d+ (чек|чека|чеков) на/);
  const item = page.getByRole("listitem").filter({ hasText: email });
  await expect(item).toContainText("оплачено сегодня");

  await item.getByRole("button", { name: "Скопировать название" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("Разбор матрицы судьбы — «Твой оракул»");
  await item.getByRole("button", { name: "Скопировать сумму" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("390");
  await item.getByRole("button", { name: "Скопировать почту" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(email);

  await item.getByRole("button", { name: "Чек отправлен" }).click();
  await expect(page.getByText(email)).toHaveCount(0);
  await context.close();
});

test("the owner gets the report and the Lila guide for free, without an e-mail, and they are not listed as receipts", async ({ browser }) => {
  const { context, page } = await signIn(browser, OWNER_NAME);
  await saveDate(page, "1985-06-15");

  await page.goto("/matrica-sudby");
  await expect(async () => {
    await page.getByRole("textbox", { name: "Дата рождения" }).fill("1985-06-15");
    await page.getByRole("button", { name: "Рассчитать матрицу", exact: true }).first().click();
    await expect(page.locator("#report-offer-title")).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 25_000 });
  const offer = page.getByRole("region", { name: "Разбор всей матрицы — 390 ₽" });
  await expect(offer.getByRole("textbox", { name: "E-mail для чека" })).toHaveCount(0);
  await offer.getByRole("button", { name: "Получить разбор бесплатно" }).click();
  await expect(page).toHaveURL(/\/portret\/razbor\//);

  // Партия с проводником: почты нет, кнопка бесплатная, игра начинается сразу
  const intention = "Почему мне трудно принять решение о работе?";
  await page.goto("/lila/igra");
  await expect(page.getByRole("textbox", { name: "E-mail для чека" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Ваше намерение" }).fill(intention);
  await page.getByRole("button", { name: "Начать с проводником — бесплатно для вас" }).click();
  await expect(page).toHaveURL(/\/lila\/igra$/, { timeout: 30_000 });
  await expect(page.locator(".game-intention")).toHaveText(intention);

  // Чек за 0 ₽ не нужен
  await page.goto("/admin/receipts");
  await expect(page.getByText("0 ₽", { exact: true })).toHaveCount(0);
  await context.close();
});
