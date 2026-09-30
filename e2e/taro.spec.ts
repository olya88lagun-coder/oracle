import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web: страницы публичные, вход не требуется
async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function draw(page: Page) {
  await page.goto("/taro/karta-dnya");
  // Клик до гидратации ничего не делает: повторяем, пока карта не появится
  await expect(async () => {
    await page.getByRole("button", { name: "Вытянуть карту дня" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Ваша карта дня" })).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 25_000 });
}

test("the index lists all 78 cards and fits a phone", async ({ page }) => {
  await page.goto("/taro");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Таро и карта дня");
  await expect(page.locator(".taro-grid a")).toHaveCount(78);
  await noHorizontalScroll(page);
});

test("a drawn card stays for the day, and a new day allows a new draw", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-05T10:00:00Z") });
  await draw(page);
  const first = await page.getByRole("heading", { level: 2 }).first().textContent();
  await page.reload();
  await expect(page.getByRole("status").filter({ hasText: "Ваша карта дня уже вытянута" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 }).first()).toHaveText(first ?? "");
  await page.clock.setFixedTime(new Date("2026-10-06T10:00:00Z"));
  await page.reload();
  await expect(page.getByRole("button", { name: "Вытянуть карту дня" })).toBeVisible();
});

test("the draw keeps only the day and the card in the browser storage", async ({ page }) => {
  await draw(page);
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("taro")));
  expect(keys).toEqual(["taro:day:v1"]);
  const value = JSON.parse((await page.evaluate(() => localStorage.getItem("taro:day:v1"))) ?? "{}");
  expect(Object.keys(value).sort()).toEqual(["card", "day"]);
});

test("the share button copies a link to the card without personal data", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (text: string) => ((window as unknown as { __copied: string }).__copied = text) }, configurable: true });
  });
  await draw(page);
  await page.getByRole("button", { name: "Поделиться картой" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ссылка скопирована." })).toBeVisible();
  const copied = await page.evaluate(() => (window as unknown as { __copied: string }).__copied);
  expect(copied).toMatch(/\/taro\/karty\/[a-z-]+\?utm_source=share/);
});

test("a card page has its sections, the credit and the matrix number for a major arcanum", async ({ page }) => {
  await page.goto("/taro/karty/sila");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Сила");
  for (const title of ["Суть", "В отношениях", "В деле и деньгах", "Как карта дня", "Действие на сегодня", "Вопрос для себя"]) {
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
  }
  await expect(page.getByText("В матрице судьбы этот аркан имеет номер 11")).toBeVisible();
  await expect(page.getByText("Рисунки Памелы Колман Смит, 1909 (общественное достояние)")).toBeVisible();
  await noHorizontalScroll(page);
  expect((await page.goto("/taro/karty/net-takoj-karty"))?.status()).toBe(404);
});
