import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web: страницы публичные, вход не требуется. Подставляем свой window.ym, чтобы видеть цели Метрики
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { ym: (id: number, method: string, goal?: string, params?: unknown) => void }).ym = (_id, method, goal, params) => {
      if (method !== "reachGoal") return;
      const calls = JSON.parse(sessionStorage.getItem("test-goals") ?? "[]");
      calls.push({ goal, hasParams: params !== undefined });
      sessionStorage.setItem("test-goals", JSON.stringify(calls));
    };
  });
});

const goals = async (page: Page): Promise<{ goal: string; hasParams: boolean }[]> => page.evaluate(() => JSON.parse(sessionStorage.getItem("test-goals") ?? "[]"));

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

// Рубашки и поле вопроса доступны только после гидратации: ждём этого и кликаем один раз
async function openFirst(page: Page, position: string) {
  await expect(page.getByRole("button", { name: position })).toBeEnabled();
  await page.getByRole("button", { name: position }).click();
  await expect(page.getByRole("status").filter({ hasText: /Открыто карт|Расклад готов/ })).toBeVisible();
}

test("the hub lists five spreads and fits a phone", async ({ page }) => {
  await page.goto("/taro/rasklady");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Расклады Таро онлайн");
  await expect(page.getByRole("link", { name: /^Сделать расклад/ })).toHaveCount(5);
  await expect(page.getByRole("link", { name: "Сделать расклад: Расклад на три карты" })).toHaveAttribute("href", "/taro/rasklady/tri-karty");
  await noHorizontalScroll(page);
});

test("a spread opens card by card, then all at once, and a new spread starts over without saving anything", async ({ page }) => {
  await page.goto("/taro/rasklady/tri-karty");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Расклад на три карты");
  await expect(page.getByRole("button", { name: /^Позиция \d: / })).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Позиция 1: Ситуация" })).toBeEnabled();
  await page.getByRole("textbox", { name: "Ваш вопрос (необязательно)" }).fill("Что мне важно увидеть?");

  await openFirst(page, "Позиция 2: Что мешает");
  await expect(page.getByRole("status").filter({ hasText: "Открыто карт: 1 из 3." })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Позиция \d: / })).toHaveCount(2);
  // Нажатая рубашка исчезла, фокус перешёл на следующую закрытую карту
  await expect(page.getByRole("button", { name: "Позиция 1: Ситуация" })).toBeFocused();
  await expect(page.locator(".taro-spread-panel h3")).toHaveCount(1);
  expect((await goals(page)).map((call) => call.goal)).not.toContain("taro_spread");

  await page.getByRole("button", { name: "Открыть все карты" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Расклад готов." })).toBeVisible();
  await expect(page.locator(".taro-spread-panel h3")).toHaveCount(3);
  await expect(page.getByRole("heading", { level: 2, name: "Трактовка расклада" })).toBeFocused();
  await expect(page.getByText("Ваш вопрос: «Что мне важно увидеть?»")).toBeVisible();
  await noHorizontalScroll(page);

  // Цель — только название, без вопроса и карт; один раз за расклад
  const fired = await goals(page);
  expect(fired.filter((call) => call.goal === "taro_spread")).toHaveLength(1);
  expect(fired.every((call) => !call.hasParams)).toBe(true);
  // Ни вопрос, ни карты не попадают в хранилище браузера
  const stored = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: Object.fromEntries(Object.entries(sessionStorage).filter(([key]) => key !== "test-goals")) }));
  expect(stored).not.toContain("Что мне важно увидеть");

  await page.getByRole("button", { name: "Новый расклад" }).click();
  await expect(page.getByRole("button", { name: /^Позиция \d: / })).toHaveCount(3);
  await expect(page.getByRole("heading", { level: 2, name: "Трактовка расклада" })).toHaveCount(0);
});

test("a five-card spread keeps the cards distinct and fits a phone", async ({ page }) => {
  await page.goto("/taro/rasklady/vybor");
  await expect(page.getByRole("button", { name: /^Позиция \d: / })).toHaveCount(5);
  await openFirst(page, "Позиция 1: Вариант А: что даёт");
  await page.getByRole("button", { name: "Открыть все карты" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Расклад готов." })).toBeVisible();
  const names = await page.locator(".taro-spread-panel h3").allTextContents();
  expect(names).toHaveLength(5);
  expect(new Set(names).size).toBe(5);
  await noHorizontalScroll(page);
});

test("unknown spreads are a real 404, and the cards in the reading link to their pages", async ({ page }) => {
  expect((await page.goto("/taro/rasklady/net-takogo"))?.status()).toBe(404);
  await page.goto("/taro/rasklady/na-segodnya");
  await openFirst(page, "Позиция 1: Утро");
  await page.getByRole("button", { name: "Открыть все карты" }).click();
  await expect(page.locator(".taro-spread-panel h3 a").first()).toHaveAttribute("href", /^\/taro\/karty\/[a-z-]+$/);
});

test("the tiles under the first screen of /taro lead to the spreads and fit a phone", async ({ page }) => {
  await page.goto("/taro");
  const tiles = page.locator(".taro-spread-tile");
  await expect(tiles).toHaveCount(5);
  await expect(page.getByRole("link", { name: "Сделать расклад: Расклад на отношения" })).toHaveAttribute("href", "/taro/rasklady/otnosheniya");
  await expect(page.getByRole("link", { name: "Все расклады Таро" })).toHaveAttribute("href", "/taro/rasklady");
  await noHorizontalScroll(page);
  await page.getByRole("link", { name: "Сделать расклад: Расклад на три карты" }).click();
  await expect(page).toHaveURL(/\/taro\/rasklady\/tri-karty$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Расклад на три карты");
});
