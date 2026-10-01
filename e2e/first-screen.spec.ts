import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web. Первый визит: cookie-панель открыта и закрывает низ экрана — главное действие должно быть выше неё
const SHORT_PHONE = { width: 390, height: 740 };

async function visibleAboveCookie(page: Page, targetY: number) {
  const cookie = await page.getByRole("dialog", { name: "Cookie" }).boundingBox();
  expect(cookie).not.toBeNull();
  expect(targetY).toBeLessThanOrEqual(cookie!.y);
}

test.describe("first visit with the cookie panel open", () => {
  // Обычные сценарии стартуют с уже сделанным выбором; здесь нужен именно первый визит
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the free calculation button on the home page is visible above the cookie panel on a short phone", async ({ page }) => {
    await page.setViewportSize(SHORT_PHONE);
    await page.goto("/");
    const button = await page.getByRole("link", { name: "Рассчитать матрицу бесплатно" }).boundingBox();
    await visibleAboveCookie(page, button!.y + button!.height);
  });

  test("all three cards of the card of the day are visible above the cookie panel on a short phone", async ({ page }) => {
    await page.setViewportSize(SHORT_PHONE);
    await page.goto("/taro/karta-dnya");
    const picks = page.getByRole("button", { name: /^Карта [123]$/ });
    await expect(picks).toHaveCount(3);
    const bottoms = await picks.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().bottom));
    await visibleAboveCookie(page, Math.max(...bottoms));
    // Факты 1/78/0 остались на странице, но ниже выбора карт
    const facts = await page.getByRole("list", { name: "Как работает карта дня" }).evaluate((node) => node.getBoundingClientRect().top);
    expect(facts).toBeGreaterThan(Math.max(...bottoms));
  });

});

test("the matrix result leads to the Lila game instead of a «soon» stub", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await expect(async () => {
    await page.getByRole("textbox", { name: "Дата рождения" }).fill("1988-11-18");
    await page.getByRole("button", { name: "Рассчитать матрицу", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 2, name: "Ваша матрица судьбы" })).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 25_000 });
  await expect(page.getByRole("link", { name: "Лила — игра с вашим вопросом" })).toHaveAttribute("href", "/lila/igra");
  await expect(page.getByText("Скоро", { exact: true })).toHaveCount(0);
});

test("the matrix method has no skipped heading level, and the matrix, blog and contacts have a preview image", async ({ page }) => {
  await page.goto("/matrica-sudby");
  const steps = page.locator(".matrix-method__steps");
  await expect(steps.getByRole("heading", { level: 3 })).toHaveCount(3);
  await expect(steps.getByRole("heading", { level: 4 })).toHaveCount(0);
  for (const path of ["/matrica-sudby", "/blog", "/contacts"]) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https?:\/\/.+\.webp$/);
  }
});

// Нужны PAID_REPORTS=on и PAID_LILA=on, как в .env.development.example
test("the home page says what is free and what is paid, with the current prices", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Бесплатно: расчёт трёх ключевых позиций матрицы, совместимость, карта дня и Лила без проводника.")).toBeVisible();
  await expect(page.getByText("По желанию: полный разбор матрицы — 390 ₽, Лила с ИИ-проводником — 490 ₽.")).toBeVisible();
});
