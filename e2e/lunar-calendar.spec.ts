import { expect, test, type Page } from "@playwright/test";

// Нужны dev:db и dev:web. Лунный календарь: страница месяца, выбор дня мышью, нажатием и стрелками, ключевые даты, переключатель месяцев.
// Ноябрь 2026 входит в окно страниц до конца 2027 года; к тому времени тесты стоит перевести на другой месяц

const MONTH = "/lunnyy-kalendar/noyabr-2026";
const caption = (page: Page) => page.locator("#moon-month-selected");
const day = (page: Page, date: string) => page.locator(`td[data-date="${date}"] button`);

// До гидратации кнопки не слушают нажатия: повторяем, пока подпись не изменится
async function choose(page: Page, date: string, expected: RegExp) {
  await expect(async () => {
    await day(page, date).click();
    await expect(caption(page)).toContainText(expected, { timeout: 1500 });
  }).toPass({ timeout: 25_000 });
}

test("the month page shows the grid of 30 days, the key dates and the Moon of the chosen day", async ({ page }) => {
  await page.goto(MONTH);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Лунный календарь на ноябрь 2026");
  await expect(page.locator(".moon-month__pick")).toHaveCount(30);
  await expect(page.locator(".moon-event")).toHaveCount(4);
  await expect(page.locator("figure.moon-curve")).toBeVisible();
  await expect(page.locator(".moon-days__row")).toHaveCount(30);
  await expect(caption(page)).toBeVisible();
});

test("choosing a day turns the big Moon to that day: full Moon on 24 November", async ({ page }) => {
  await page.goto(MONTH);
  await choose(page, "2026-11-24", /24 ноября · Полнолуние/);
  await expect(day(page, "2026-11-24")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('.moon-month__panel .moon-disc')).toHaveAttribute("data-phase", "full");
});

test("arrow keys move the choice across days and weeks, and Home and End jump to the ends of the month", async ({ page }) => {
  await page.goto(MONTH);
  await choose(page, "2026-11-10", /10 ноября/);
  await page.keyboard.press("ArrowRight");
  await expect(caption(page)).toContainText("11 ноября");
  await page.keyboard.press("ArrowDown");
  await expect(caption(page)).toContainText("18 ноября");
  await page.keyboard.press("End");
  await expect(caption(page)).toContainText("30 ноября");
  await page.keyboard.press("Home");
  await expect(caption(page)).toContainText("1 ноября");
});

test("a key date button leads the Moon to the date of that event", async ({ page }) => {
  await page.goto(MONTH);
  await expect(async () => {
    await page.locator('.moon-event[data-kind="new"]').click();
    await expect(caption(page)).toContainText("9 ноября", { timeout: 1500 });
  }).toPass({ timeout: 25_000 });
  await expect(caption(page)).toContainText("Новолуние");
});

test("the switcher leads to the next month and the entry address leads to the current one", async ({ page }) => {
  await page.goto(MONTH);
  await page.getByRole("link", { name: /Декабрь 2026 →/ }).click();
  await expect(page).toHaveURL(/\/lunnyy-kalendar\/dekabr-2026$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Лунный календарь на декабрь 2026");
  await page.goto("/lunnyy-kalendar");
  await expect(page).toHaveURL(/\/lunnyy-kalendar\/[a-z]+-\d{4}$/);
});

test("on the page of the current month today is marked in the grid, in the table and on the curve and ribbon", async ({ page }) => {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Moscow" });
  await page.goto("/lunnyy-kalendar");
  await expect(page).toHaveURL(/\/lunnyy-kalendar\/[a-z]+-\d{4}$/);
  await expect(page.locator(".moon-month")).toHaveAttribute("data-has-today", "true");
  await expect(page.locator(`td.moon-month__cell.is-today[data-date="${today}"]`)).toHaveCount(1);
  await expect(page.locator(`tr.moon-days__row.is-today[data-date="${today}"]`)).toHaveCount(1);
  await expect(page.locator(`tr.moon-days__row.is-today[data-date="${today}"]`)).toHaveAttribute("aria-current", "date");
  await expect(page.locator(".moon-days__row.is-today")).toHaveCount(1);
});

test("the page has the intro and four questions with the real dates of the month", async ({ page }) => {
  await page.goto(MONTH);
  await expect(page.locator(".moon-month__intro")).toBeVisible();
  await expect(page.locator(".moon-faq details")).toHaveCount(4);
  await page.getByText("Когда полнолуние в ноябре 2026?").click();
  await expect(page.locator(".moon-faq")).toContainText("24 ноября");
});

test("the ribbon shows a glyph and a name for each sign", async ({ page }) => {
  await page.goto(MONTH);
  const segments = page.locator(".moon-ribbon__seg");
  expect(await segments.count()).toBeGreaterThanOrEqual(11);
  await expect(page.locator(".moon-ribbon__glyph")).toHaveCount(await segments.count());
  await expect(page.locator(".moon-ribbon__sign").first()).not.toBeEmpty();
});

test("a month outside the window is a real 404", async ({ page }) => {
  const response = await page.goto("/lunnyy-kalendar/yanvar-2020");
  expect(response?.status()).toBe(404);
});

test("there is no horizontal scroll at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto(MONTH);
  await expect(page.locator("table.moon-month__grid")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the choice of a day works at once", async ({ page }) => {
    await page.goto(MONTH);
    await choose(page, "2026-11-24", /24 ноября · Полнолуние/);
    await expect(page.locator(".moon-curve__line")).toBeVisible();
  });
});

test("every day cell shows a phase engraving and keeps its accessible name", async ({ page }) => {
  await page.goto(MONTH);
  await expect(page.locator(".moon-month__pick")).toHaveCount(30);
  await expect(page.locator(".moon-month__pick img[src^='/luna/phases/']")).toHaveCount(30);
  const names = await page.locator(".moon-month__pick").evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label") ?? ""));
  for (const name of names) expect(name).toMatch(/освещено \d+ %/);
});
