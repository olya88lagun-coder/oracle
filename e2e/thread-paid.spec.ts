import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

// Платный «Разбор нити». Нужны PAYMENTS=fake, PAID_THREAD=on, DEV_LOGIN=1 и OWNER_VK_ID=dev-Владелица у сайта, запущенные dev:db и воркер (dev:worker).
// Продажа открыта только после принятия партии 10 текстов нумерологии (NUMEROLOGY_ACCEPTED_BATCHES): пока блока нет, сценарии сами пропускаются

const THREAD = "/numerologiya/grafik-sudby";
const OWNER_NAME = "Владелица";
const offer = (page: Page) => page.getByRole("region", { name: "Разбор нити — 490 ₽" });

async function calculate(page: Page) {
  await page.goto(THREAD);
  // Сразу после загрузки гидратация может стереть заполненное поле: повторяем ввод, пока нить не построится
  await expect(async () => {
    await page.getByLabel("Дата рождения").fill("1990-03-07");
    await page.getByRole("button", { name: "Показать мою нить" }).click();
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 30_000 });
}

// Блок продажи есть только при PAID_THREAD=on и принятой партии 10; иначе сценарий пропускается с понятной причиной
async function calculateOrSkip(page: Page) {
  await calculate(page);
  await page.waitForTimeout(500);
  test.skip((await offer(page).count()) === 0, "Блока «Разбор нити — 490 ₽» нет: включите PAID_THREAD=on и примите партию 10 (NUMEROLOGY_ACCEPTED_BATCHES)");
}

async function expectReport(page: Page) {
  await expect(page).toHaveURL(/\/portret\/razbor\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Разбор нити", { timeout: 60_000 });
  await expect(page.locator(".report-chapter")).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("a guest sees the offer with a login link", async ({ page }) => {
  await calculateOrSkip(page);
  await expect(offer(page).locator("ol li")).toHaveCount(6);
  await expect(offer(page).getByRole("link", { name: "Войти и купить разбор — 490 ₽" })).toHaveAttribute("href", /^\/login\?next=/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("a signed-in visitor buys the report, reads six chapters and cannot buy the same date twice", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Нить"));
  await calculateOrSkip(page);

  await offer(page).getByRole("button", { name: "Купить разбор — 490 ₽" }).click();
  await expect(offer(page).getByRole("alert")).toContainText("e-mail");

  await offer(page).getByRole("textbox", { name: "E-mail для чека" }).fill("test@example.ru");
  await offer(page).getByRole("button", { name: "Купить разбор — 490 ₽" }).click();
  await expect(page).toHaveURL(/\/dev\/pay\//);
  await page.getByRole("button", { name: "Оплатить" }).click();
  await expectReport(page);
  const reportUrl = page.url();

  // Ту же дату второй раз не продают: страница ведёт на готовый разбор
  await calculate(page);
  await offer(page).getByRole("textbox", { name: "E-mail для чека" }).fill("test@example.ru");
  await offer(page).getByRole("button", { name: "Купить разбор — 490 ₽" }).click();
  await expect(page).toHaveURL(reportUrl);
  await context.close();
});

test("the owner gets the report for free, without an e-mail", async ({ browser }) => {
  const { context, page } = await signIn(browser, OWNER_NAME);
  await calculateOrSkip(page);

  await expect(offer(page).getByRole("textbox", { name: "E-mail для чека" })).toHaveCount(0);
  await offer(page).getByRole("button", { name: "Получить разбор бесплатно" }).click();
  await expectReport(page);
  await context.close();
});
