import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

// Сохранение натальной карты в портрет: вход, сохранение, портрет, удаление данных.
// Нужны запущенные dev:db, dev:web и DEV_LOGIN=1 (см. AGENTS.md); город ищется по настоящему списку через /api/cities

const NATAL = "/natalnaya-karta";
const SAVE_STATUS = ".natal-save__status";
const PORTRAIT_LINE = ".portrait-natal__data";

async function calculateMoscow(page: Page) {
  await page.getByRole("textbox", { name: "Дата рождения" }).fill("1990-03-07");
  await page.getByLabel("Время рождения", { exact: true }).fill("12:00");
  await page.getByRole("combobox", { name: "Место рождения" }).fill("Москва");
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: "Рассчитать карту" }).click();
  await expect(page.getByRole("heading", { name: "Ваша натальная карта" })).toBeVisible();
}

test("a signed-in user saves the chart data, sees it in the portrait and loses it with the account data", async ({ browser }) => {
  const name = uniqueName("Мила");
  const { context, page } = await signIn(browser, name);
  await expect(page.locator(".portrait-natal")).toHaveCount(0);

  await page.goto(NATAL);
  await calculateMoscow(page);
  await expect(page.getByRole("button", { name: "Сохранить в портрет" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Войти и сохранить" })).toHaveCount(0);
  await page.getByRole("button", { name: "Сохранить в портрет" }).click();

  await expect(page.locator(SAVE_STATUS)).toHaveText("Сохранено.");
  await expect(page.getByRole("button", { name: "Сохранить в портрет" })).toHaveCount(0);
  expect(page.url()).not.toContain("1990");

  // Портрет: раздел с датой, временем и местом
  await page.goto("/portret");
  await expect(page.getByRole("heading", { name: "Натальная карта", level: 2 })).toBeVisible();
  await expect(page.locator(PORTRAIT_LINE)).toHaveText("7 марта 1990 · 12:00 · Москва");
  await expect(page.getByText("7 марта 1990", { exact: true })).toBeVisible();

  // Из портрета — на карту: форма уже заполнена, карта посчитана, сохранять нечего
  await page.getByRole("link", { name: "Открыть карту" }).click();
  await expect(page).toHaveURL(/\/natalnaya-karta$/);
  await expect(page.getByRole("textbox", { name: "Дата рождения" })).toHaveValue("1990-03-07");
  await expect(page.getByRole("combobox", { name: "Место рождения" })).toHaveValue("Москва");
  await expect(page.getByRole("heading", { name: "Ваша натальная карта" })).toBeVisible();
  await expect(page.locator(SAVE_STATUS)).toHaveText("Сохранено.");

  // «Удалить мои данные» стирает и время с местом
  await page.goto("/portret");
  await page.getByRole("link", { name: "Удалить мои данные" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Удалить навсегда" }).click();
  await expect(page).toHaveURL(/\/\?deleted=1$/);

  // Тот же аккаунт входит заново как новый пользователь: в портрете нет ни даты, ни карты
  await page.goto(`/api/dev/login?name=${encodeURIComponent(name)}`);
  await expect(page).toHaveURL(/\/portret$/);
  await expect(page.locator(".portrait-natal")).toHaveCount(0);
  await expect(page.getByText("7 марта 1990")).toHaveCount(0);
  await page.goto(NATAL);
  await expect(page.getByRole("textbox", { name: "Дата рождения" })).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Ваша натальная карта" })).toHaveCount(0);
  await context.close();
});

test("a guest is offered to sign in, and the entered data is saved after the login without being kept in the address", async ({ page }) => {
  await page.goto(NATAL);
  await calculateMoscow(page);

  const login = page.getByRole("link", { name: "Войти и сохранить" });
  await expect(login).toHaveAttribute("href", "/login?next=%2Fnatalnaya-karta");
  await expect(page.getByRole("button", { name: "Сохранить в портрет" })).toHaveCount(0);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes("natal")))).toEqual([]);

  await login.click();
  await expect(page).toHaveURL(/\/login\?next=%2Fnatalnaya-karta$/);
  // Введённое лежит только в sessionStorage этой вкладки
  expect(await page.evaluate(() => sessionStorage.getItem("oracle-natal-pending") !== null)).toBe(true);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes("natal")))).toEqual([]);

  // VK ID на localhost недоступен — dev-вход повторяет возврат со входа с тем же next
  await page.goto(`/api/dev/login?name=${encodeURIComponent(uniqueName("Лика"))}&next=${NATAL}`);
  await expect(page).toHaveURL(/\/natalnaya-karta$/);
  await expect(page.locator(SAVE_STATUS)).toHaveText("Сохранено.");
  await expect(page.getByRole("textbox", { name: "Дата рождения" })).toHaveValue("1990-03-07");
  await expect(page.getByRole("heading", { name: "Ваша натальная карта" })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("oracle-natal-pending"))).toBeNull();

  await page.goto("/portret");
  await expect(page.locator(PORTRAIT_LINE)).toHaveText("7 марта 1990 · 12:00 · Москва");
});

test("a signed-in user with other data in the portrait is warned before it is replaced", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Зоя"));
  await page.getByRole("textbox", { name: "Дата рождения" }).fill("1985-12-01");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("status")).toHaveText("Сохранено.");

  await page.goto(NATAL);
  await expect(page.getByRole("textbox", { name: "Дата рождения" })).toHaveValue("1985-12-01");
  await calculateMoscow(page);

  await expect(page.getByText("В портрете сейчас другие данные рождения. Сохранить эти вместо них?")).toBeVisible();
  await page.getByRole("button", { name: "Сохранить в портрет" }).click();
  await expect(page.locator(SAVE_STATUS)).toHaveText("Сохранено.");
  await page.goto("/portret");
  await expect(page.getByText("7 марта 1990", { exact: true })).toBeVisible();
  await expect(page.locator(PORTRAIT_LINE)).toHaveText("7 марта 1990 · 12:00 · Москва");
  await context.close();
});
