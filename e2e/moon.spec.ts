import { expect, test } from "@playwright/test";

// Нужны dev:db и dev:web. Страница «Луна сегодня»: диск, лента из 14 дней, ссылки, без горизонтальной прокрутки

test("the Moon today page shows the disc, the tiles and a 14-day strip", async ({ page }) => {
  await page.goto("/luna-segodnya");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Луна сегодня,");
  await expect(page.locator("figure.moon-disc")).toBeVisible();
  await expect(page.locator(".moon-tile")).toHaveCount(4);
  await expect(page.locator(".moon-strip__day")).toHaveCount(14);
  await expect(page.locator(".moon-next")).toContainText("Ближайшая смена");
});

test("the Moon today page describes the day: the phase, the lunar day and the sign, each with a question for oneself", async ({ page }) => {
  await page.goto("/luna-segodnya");
  await expect(page.locator(".moon-text__block")).toHaveCount(3);
  await expect(page.locator(".moon-text__question").first()).toContainText("?");
});

test("the Moon today page leads to the card of the day and the natal chart", async ({ page }) => {
  await page.goto("/luna-segodnya");
  await expect(page.getByRole("link", { name: "Вытянуть карту дня" })).toHaveAttribute("href", "/taro/karta-dnya");
  await expect(page.getByRole("link", { name: "Какая Луна в вашей натальной карте" })).toHaveAttribute("href", "/natalnaya-karta");
});

test("the Moon page and the Taro pages link to each other and the footer has the Moon link", async ({ page }) => {
  await page.goto("/taro/karta-dnya");
  await expect(page.getByRole("link", { name: /Луна сегодня/ }).first()).toHaveAttribute("href", "/luna-segodnya");
  await page.goto("/taro");
  await expect(page.getByRole("link", { name: /Луна сегодня/ }).first()).toHaveAttribute("href", "/luna-segodnya");
});

test("there is no horizontal scroll at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/luna-segodnya");
  await expect(page.locator("figure.moon-disc")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("the page stays complete", async ({ page }) => {
    await page.goto("/luna-segodnya");
    await expect(page.locator("figure.moon-disc")).toBeVisible();
    await expect(page.locator(".moon-strip__day")).toHaveCount(14);
  });
});

test("the Moon today page lets the visitor write a thought and keeps it only in the browser", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST") posts.push(request.url()); });
  await page.addInitScript(() => window.localStorage.removeItem("moon:diary:v1"));
  await page.goto("/luna-segodnya");
  await page.getByRole("button", { name: "Записать мысль на сегодня" }).click();
  await page.getByPlaceholder("Одна строка о том, что вы заметили").fill("тест");
  await page.getByRole("button", { name: "Записать", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Записано." })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("moon:diary:v1") ?? "{}") as Record<string, string>);
  expect(Object.values(stored)).toContain("тест");
  expect(posts).toEqual([]);
});
