import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web: страницы публичные, вход не требуется
async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("the blog lists its articles and the footer links to it and to the community", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Блог");
  // Статей становится больше: проверяем, что есть главный материал и сетка не короче первых пяти
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  await expect.poll(() => page.locator('main a[href^="/blog/"]').count()).toBeGreaterThanOrEqual(6);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Блог" })).toHaveAttribute("href", "/blog");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "ВКонтакте" })).toHaveAttribute("href", "https://vk.ru/tvoy_orakul");
  await noHorizontalScroll(page);
});

test("the topic filters narrow the blog and the count follows", async ({ page }) => {
  await page.goto("/blog");
  const status = page.getByRole("status").filter({ hasText: /материал/ });
  await expect(status).toContainText(/\d+ материал/);
  await page.getByRole("button", { name: /^Лила/ }).click();
  await expect(status).toHaveText("3 материала");
  await expect(page.getByRole("button", { name: /^Лила/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Все материалы/ }).click();
  await expect(page.getByRole("button", { name: /^Все материалы/ })).toHaveAttribute("aria-pressed", "true");
});

test("an article shows its meta, a table of contents, a practice link and related articles", async ({ page }) => {
  await page.goto("/blog/rasshifrovka-matritsy-sudby");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Расшифровка матрицы судьбы: как читать позиции");
  await expect(page.getByText(/≈ \d+ мин/).first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Оглавление статьи" })).toBeAttached();
  await expect(page.getByRole("complementary", { name: "Практика по теме статьи" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Читайте дальше" })).toBeVisible();
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
  await expect(page.locator("summary", { hasText: "Нужна ли регистрация?" })).toBeVisible();
  await noHorizontalScroll(page);
});
