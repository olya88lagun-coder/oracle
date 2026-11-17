import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web (и dev:db). Диаграмма первого экрана /matrica-sudby: пример, пересчёт на дате человека

const live = (page: Page) => page.locator(".matrix-live");
const node = (page: Page, point: string) => page.locator(`.matrix-live [data-point="${point}"] text`);

// До гидратации поле дату не слушает, поэтому ввод повторяем, пока диаграмма не перейдёт на дату.
// Перед датой стираем поле: React не считает изменением повторный ввод того же значения
async function typeDate(page: Page, iso: string) {
  await expect(async () => {
    const field = page.getByRole("textbox", { name: "Дата рождения" });
    await field.fill("");
    await field.fill(iso);
    await expect(live(page)).toHaveAttribute("data-state", "date", { timeout: 2000 });
  }).toPass({ timeout: 25_000 });
}

test("the first screen shows an example diagram before any date is typed", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await expect(live(page)).toBeVisible();
  await expect(live(page)).toHaveAttribute("data-state", "example");
  await expect(page.locator(".matrix-live__caption")).toHaveText("Пример · вымышленная дата");
  await expect(live(page)).toHaveAttribute("aria-hidden", "true");
});

test("typing a date turns the diagram into the visitor's matrix", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await typeDate(page, "1990-03-07");
  await expect(page.locator(".matrix-live__caption")).toHaveText("Ваша матрица · 7 марта 1990");
  // «Прокрутка» длится ~1 с; после неё узлы стоят на числах матрицы 07.03.1990
  await expect(live(page)).toHaveAttribute("data-phase", "idle", { timeout: 5000 });
  await expect(node(page, "A")).toHaveText("7");
  await expect(node(page, "E")).toHaveText("4");
  await expect(node(page, "D")).toHaveText("11");
  expect(page.url()).not.toMatch(/1990/);
});

test("an impossible date leaves the diagram as it was", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await typeDate(page, "1990-03-07");
  await expect(live(page)).toHaveAttribute("data-phase", "idle", { timeout: 5000 });
  await page.getByRole("textbox", { name: "Дата рождения" }).fill("1850-01-01");
  await expect(live(page)).toHaveAttribute("data-state", "date");
  await expect(page.locator(".matrix-live__caption")).toHaveText("Ваша матрица · 7 марта 1990");
  await expect(node(page, "E")).toHaveText("4");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the diagram changes at once, without rolling", async ({ page }) => {
    await page.goto("/matrica-sudby");
    await typeDate(page, "1990-03-07");
    await expect(live(page)).toHaveAttribute("data-phase", "idle");
    await expect(node(page, "E")).toHaveText("4");
    await expect(live(page).locator(".is-flash")).toHaveCount(0);
  });
});

test("there is no horizontal scroll at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/matrica-sudby");
  await expect(live(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
