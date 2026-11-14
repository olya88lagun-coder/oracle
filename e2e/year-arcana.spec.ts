import { expect, test } from "@playwright/test";

// Нужен только dev:web. Рекламные заходы VK приходят на /arkan-2027: из результата должен быть понятный бесплатный путь в матрицу

test("the 2027 arcanum result bridges into the free matrix with the date handed over", async ({ page }) => {
  await page.goto("/arkan-2027");
  await page.getByRole("textbox", { name: "Дата рождения" }).fill("1988-11-18");
  await page.getByRole("button", { name: "Узнать мой аркан 2027" }).click();

  const bridge = page.locator(".year-bridge");
  await expect(bridge.getByRole("heading", { name: "Он вырос из вашей матрицы" })).toBeVisible();
  // Три ключевые позиции названы, значения остаются в матрице
  const keys = bridge.getByRole("list", { name: "Три ключевые позиции" }).getByRole("listitem");
  await expect(keys).toHaveCount(3);
  await expect(keys.nth(0)).toContainText("Луна");
  await expect(keys.nth(1)).toContainText("Сила");
  await expect(keys.nth(2)).toContainText("Колесо Фортуны");
  // Дата в адрес не попадает
  expect(page.url()).not.toContain("1988");

  await bridge.getByRole("link", { name: "Рассчитать матрицу бесплатно" }).click();
  await expect(page).toHaveURL(/\/matrica-sudby$/);
  // Матрица сразу построена по переданной дате, повторно вводить её не нужно
  await expect(page.getByRole("region", { name: "Ваша матрица судьбы" }).getByRole("heading", { name: "Аркан 11, Сила" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Дата рождения" })).toHaveValue("1988-11-18");
  expect(page.url()).not.toContain("1988");
});

test("the bridge does not add horizontal scroll on a phone", async ({ page }) => {
  await page.goto("/arkan-2027");
  await page.getByRole("textbox", { name: "Дата рождения" }).fill("1988-11-18");
  await page.getByRole("button", { name: "Узнать мой аркан 2027" }).click();
  await expect(page.locator(".year-bridge")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
