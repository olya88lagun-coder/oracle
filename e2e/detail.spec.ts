import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web: страницы публичные, вход не требуется
async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function zoomAndClose(page: Page) {
  const opener = page.getByRole("button", { name: "Увеличить изображение" });
  // Клик до гидратации ничего не открывает: повторяем, пока диалог не появится
  await expect(async () => {
    await opener.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(opener).toBeFocused();
}

test("an arcanum page has ten sections, a contents list, a zoomable picture and neighbours", async ({ page }) => {
  await page.goto("/matrica-sudby/arkan-6-vlyublennye");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Влюблённые");
  await expect(page.locator("details.arcanum-section")).toHaveCount(10);
  await expect(page.getByRole("navigation", { name: "На этой странице" })).toBeAttached();
  await expect(page.getByRole("navigation", { name: "Соседние арканы" }).getByRole("link")).toHaveCount(2);
  await zoomAndClose(page);
  await noHorizontalScroll(page);
});

test("a tarot card page keeps the credit, the matrix number for a major arcanum and same-suit neighbours", async ({ page }) => {
  await page.goto("/taro/karty/mechi-dvoyka");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Двойка Мечей");
  // У младших карт связи с матрицей нет
  await expect(page.getByText("В матрице судьбы этот аркан имеет номер")).toHaveCount(0);
  const neighbours = page.getByRole("navigation", { name: "Соседние карты масти" });
  await expect(neighbours.getByRole("link").first()).toHaveAttribute("href", "/taro/karty/mechi-tuz");
  await expect(neighbours.getByRole("link").last()).toHaveAttribute("href", "/taro/karty/mechi-troyka");
  await expect(page.getByText("Рисунки Памелы Колман Смит, 1909 (общественное достояние)")).toBeVisible();
  await zoomAndClose(page);
  await noHorizontalScroll(page);
});

test("a Lila cell shows its arrow, snake or no transition, and the cell on the board", async ({ page }) => {
  await page.goto("/lila/kletki/17-sostradanie");
  await expect(page.getByRole("heading", { level: 2, name: "Стрела: 17 → 69" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Клетка 69/ })).toHaveAttribute("href", /\/lila\/kletki\/69-/);
  await expect(page.getByRole("heading", { level: 2, name: "Клетка на поле" })).toBeVisible();
  await expect(page.getByText("Цель игры · 68")).toBeVisible();

  await page.goto("/lila/kletki/12-zavist");
  await expect(page.getByRole("heading", { level: 2, name: "Змея: 12 → 8" })).toBeVisible();

  await page.goto("/lila/kletki/65-plan-vnutrennego-prostranstva");
  await expect(page.getByRole("heading", { level: 2, name: /^(Стрела|Змея):/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Вопросы для размышления" })).toBeVisible();
  await zoomAndClose(page);
  await noHorizontalScroll(page);
});
