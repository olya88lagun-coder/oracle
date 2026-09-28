import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

// Нужны PAYMENTS=fake и PAID_REPORTS=on у сайта и запущенный воркер (pnpm dev:worker): разбор собирается из блоков без ИИ
const DATE = "1988-11-18";

async function calculate(page: Page, iso = DATE) {
  await page.getByRole("textbox", { name: "Дата рождения" }).fill(iso);
  await page.getByRole("button", { name: "Рассчитать" }).click();
}

const offer = (page: Page) => page.getByRole("region", { name: "Разбор всей матрицы — 390 ₽" });

async function buyAndPay(page: Page, outcome: "Оплатить" | "Отменить" = "Оплатить") {
  await offer(page).getByRole("textbox", { name: "E-mail для чека" }).fill("test@example.ru");
  await offer(page).getByRole("button", { name: "Купить разбор — 390 ₽" }).click();
  await expect(page).toHaveURL(/\/dev\/pay\//);
  await page.getByRole("button", { name: outcome }).click();
  await expect(page).toHaveURL(/\/portret\/razbor\/[0-9a-f-]{36}$/);
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("a guest sees the offer with seven chapters and is sent to log in", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await calculate(page);

  await expect(offer(page).getByRole("listitem")).toHaveCount(7);
  await expect(offer(page)).toContainText("7 Колесница · 4 Император");
  await expect(offer(page).getByRole("link", { name: "Войти и купить разбор" })).toHaveAttribute("href", "/login?next=%2Fmatrica-sudby");
  await noHorizontalScroll(page);
});

// Удаление разборов вместе с данными проверяют юнит-тесты packages/db (delete-user.test.ts)
test("a signed-in visitor buys the report, waits and reads it; the portrait lists it", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Покупка"));
  await page.goto("/matrica-sudby");
  await calculate(page);

  await offer(page).getByRole("button", { name: "Купить разбор — 390 ₽" }).click();
  await expect(offer(page).getByRole("alert")).toContainText("e-mail");

  await buyAndPay(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ваш центр — Сила", { timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 2, name: "Отношения" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Ваш сценарий" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Эксперимент на 7 дней" })).toBeVisible();
  await noHorizontalScroll(page);
  const reportUrl = page.url();

  await page.goto("/matrica-sudby");
  await expect(offer(page).getByRole("link", { name: "Открыть разбор" })).toHaveAttribute("href", new URL(reportUrl).pathname);
  await page.goto("/portret");
  await expect(page.getByRole("region", { name: "Разборы" })).toContainText("по дате 18.11.1988");

  const { context: strangerContext, page: stranger } = await signIn(browser, uniqueName("Чужой"));
  const foreign = await stranger.goto(reportUrl);
  expect(foreign?.status()).toBe(404);
  await strangerContext.close();

  await context.close();
});

test("a canceled payment offers to try again", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Отмена"));
  await page.goto("/matrica-sudby");
  await calculate(page, "1990-05-14");

  await buyAndPay(page, "Отменить");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Оплата не прошла");
  // Кнопка работает после гидратации: next dev собирает клиентский код страницы при первом заходе
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Попробовать снова" }).click();
  await expect(page).toHaveURL(/\/dev\/pay\//);
  await context.close();
});
