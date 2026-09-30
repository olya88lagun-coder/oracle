import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web: страницы публичные, вход не требуется
async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("the blog lists four articles and the footer links to it and to the community", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Блог");
  await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveCount(4);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Блог" })).toHaveAttribute("href", "/blog");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "ВКонтакте" })).toHaveAttribute("href", "https://vk.ru/tvoy_orakul");
  await noHorizontalScroll(page);
});

test("the snakes and arrows article fits a phone and links to the cells", async ({ page }) => {
  await page.goto("/blog/zmei-i-strely-lily");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Змеи и стрелы Лилы: полный список и значение");
  await expect(page.getByRole("table")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Зависть" }).first()).toHaveAttribute("href", "/lila/kletki/12-zavist");
  await noHorizontalScroll(page);
  expect((await page.goto("/blog/net-takoj-stati"))?.status()).toBe(404);
});

test("the matrix page explains the calculation and answers common questions", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2, name: "Как считается матрица судьбы" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Нужна ли регистрация?" })).toBeVisible();
  await noHorizontalScroll(page);
});
