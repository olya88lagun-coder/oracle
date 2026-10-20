import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

// Платный разбор натальной карты. Нужны PAYMENTS=fake, PAID_NATAL=on и DEV_LOGIN=1 у сайта, запущенные dev:db и воркер (dev:worker):
// разбор собирается из готовых текстов без ИИ. Город ищется по настоящему списку через /api/cities

const NATAL = "/natalnaya-karta";
const offer = (page: Page) => page.getByRole("region", { name: "Разбор натальной карты — 490 ₽" });

async function calculate(page: Page, time: string | null = "12:00") {
  // Сразу после загрузки гидратация может стереть заполненные поля: повторяем ввод, пока карта не построится
  await expect(async () => {
    await page.getByRole("textbox", { name: "Дата рождения" }).fill("1990-03-07");
    if (time) await page.getByLabel("Время рождения", { exact: true }).fill(time);
    else await page.getByLabel("Время рождения неизвестно").check();
    const city = page.getByRole("combobox", { name: "Место рождения" });
    if ((await city.inputValue()) !== "Москва") {
      await city.fill("Москва");
      await page.getByRole("option", { name: "Москва" }).first().click({ timeout: 4000 });
    }
    await page.getByRole("button", { name: "Рассчитать карту" }).click();
    await expect(page.getByRole("heading", { name: "Ваша натальная карта" })).toBeVisible({ timeout: 4000 });
  }).toPass({ timeout: 30_000 });
}

test("a guest sees the offer with nine chapters and a login link; without the birth time there is no buy button", async ({ page }) => {
  await page.goto(NATAL);
  await calculate(page);
  await expect(offer(page)).toBeVisible();
  await expect(offer(page).locator(".report-toc li")).toHaveCount(9);
  await expect(offer(page)).toContainText("Любовь и ценности");
  await expect(offer(page).getByRole("link", { name: "Войти и купить разбор — 490 ₽" })).toHaveAttribute("href", "/login?next=%2Fnatalnaya-karta");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto(NATAL);
  await calculate(page, null);
  await expect(offer(page)).toContainText("Для разбора нужно время рождения");
  await expect(offer(page).getByRole("link")).toHaveCount(0);
  await expect(offer(page).getByRole("button")).toHaveCount(0);
});

test("a signed-in visitor buys the report, reads nine chapters, cannot buy the same data twice and deletes it with the account data", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Натал"));
  await page.goto(NATAL);
  await calculate(page);

  await offer(page).getByRole("button", { name: "Купить разбор — 490 ₽" }).click();
  await expect(offer(page).getByRole("alert")).toContainText("e-mail");

  await offer(page).getByRole("textbox", { name: "E-mail для чека" }).fill("test@example.ru");
  await offer(page).getByRole("button", { name: "Купить разбор — 490 ₽" }).click();
  await expect(page).toHaveURL(/\/dev\/pay\//);
  await page.getByRole("button", { name: "Оплатить" }).click();
  await expect(page).toHaveURL(/\/portret\/razbor\/[0-9a-f-]{36}$/);
  const reportUrl = page.url();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Разбор натальной карты", { timeout: 60_000 });
  await expect(page.locator(".report-chapter")).toHaveCount(9);
  await expect(page.getByRole("heading", { level: 2, name: "Ваш сценарий" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Эксперимент на 7 дней" })).toBeVisible();
  await expect(page.getByText("07.03.1990, Москва")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const id = new URL(reportUrl).pathname.split("/").pop();
  expect((await page.request.get(`/api/reports/${id}/pdf`)).status()).toBe(404);

  // Те же данные второй раз не продаются: страница ведёт на готовый разбор
  await page.goto(NATAL);
  await calculate(page);
  await offer(page).getByRole("textbox", { name: "E-mail для чека" }).fill("test@example.ru");
  await offer(page).getByRole("button", { name: "Купить разбор — 490 ₽" }).click();
  await expect(page).toHaveURL(reportUrl);

  // Портрет: разбор в списке, после удаления данных страница 404
  await page.goto("/portret");
  await expect(page.getByRole("heading", { level: 3, name: /Разбор натальной карты · по дате 07\.03\.1990/ })).toBeVisible();
  await page.getByRole("link", { name: "Удалить мои данные" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Удалить навсегда" }).click();
  // Сам разбор стирается вместе с данными: это проверяют юнит-тесты packages/db (delete-user.test.ts)
  await expect(page).toHaveURL(/\/\?deleted=1$/);
  await context.close();
});
