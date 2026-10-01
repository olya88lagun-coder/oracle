import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

// Нужны dev:db, dev:web и DEV_LOGIN=1. Свой кубик даёт детерминированный путь: 6 (вход) → 5 (клетка 6) → 6 (клетка 12, змея на 8)
const INTENTION = "Почему мне трудно принять решение о работе?";

async function start(page: Page) {
  await page.goto("/lila/igra");
  await page.getByRole("textbox", { name: "Ваше намерение" }).fill(INTENTION);
  // «Играть» и «Играть без проводника» — разные режимы; платный блок в этом плане выключен
  await page.getByRole("button", { name: /^Играть( без проводника)?$/ }).click();
  await expect(page.locator(".game-intention")).toHaveText(INTENTION);
}

async function ownRoll(page: Page, value: number) {
  const group = page.getByRole("group", { name: "Что выпало на вашем кубике" });
  if (!(await group.isVisible())) await page.getByRole("button", { name: "Играю со своим кубиком" }).click();
  await group.getByRole("button", { name: `Выпало ${value}` }).click();
}

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test("the landing lists 72 cells and links to a cell page", async ({ page }) => {
  await page.goto("/lila");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Лила — игра с вашим намерением");
  await expect(page.getByRole("region", { name: "72 клетки" }).getByRole("link")).toHaveCount(72);
  await page.getByRole("link", { name: "12 · Зависть" }).click();
  await expect(page).toHaveURL("/lila/kletki/12-zavist");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Зависть");
  await expect(page.getByRole("heading", { level: 2, name: /Змея: 12 → 8/ })).toBeVisible();
  await noHorizontalScroll(page);
  expect((await page.goto("/lila/kletki/12-alchnost"))?.status()).toBe(404);
});

test("a guest plays: waits for a six, meets a snake, keeps the game after a reload", async ({ page }) => {
  await start(page);
  await ownRoll(page, 3);
  await expect(page.getByRole("heading", { level: 2, name: "Пауза" })).toBeVisible();
  await ownRoll(page, 6);
  await expect(page.getByRole("heading", { level: 2, name: "Рождение" })).toBeVisible();
  await ownRoll(page, 5);
  await ownRoll(page, 6);
  // Змея: ход показывает клетку падения (12), а конечная клетка (8) — ссылкой с подписью перехода
  await expect(page.getByRole("heading", { level: 2, name: "Зависть" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Змея · 12 → 8/ })).toContainText("Алчность");
  await expect(page.getByText(/Открыто клеток · 4 \/ 72/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Войти и сохранить партию" })).toHaveAttribute("href", "/login?next=%2Flila%2Figra");
  await noHorizontalScroll(page);

  await page.reload();
  await expect(page.locator(".game-intention")).toHaveText(INTENTION);
  await expect(page.getByText("4 хода", { exact: true })).toBeVisible();
});

test("tabs split the game, the token waits for a six, and the zoomed board closes with Escape", async ({ page }) => {
  await start(page);
  const tabs = page.getByRole("tablist", { name: "Разделы партии" });
  // До первой шестёрки фишки на поле нет, а не стоит на клетке 1
  await page.getByRole("tab", { name: "Поле" }).click();
  await expect(page.locator(".lila-board__token")).toHaveCount(0);
  await ownRoll(page, 6);
  await expect(page.locator(".lila-board__token")).toHaveCount(2);

  await page.getByRole("button", { name: "Рассмотреть поле" }).click();
  await expect(page.getByRole("dialog", { name: "Поле Лилы" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Поле Лилы" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Рассмотреть поле" })).toBeFocused();

  // Стрелки переключают вкладки; история — только список ходов, без кубика
  await tabs.getByRole("tab", { name: "Поле" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: "История" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { level: 2, name: "История партии" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Бросить кубик" })).toBeHidden();
  await noHorizontalScroll(page);
});

test("a guest game is saved to the portrait after login and shows in «Мои партии»", async ({ page, context }) => {
  await start(page);
  await ownRoll(page, 6);
  await page.goto(`/api/dev/login?name=${encodeURIComponent(uniqueName("Партия"))}`);
  await expect(page).toHaveURL(/\/portret/);

  await page.goto("/lila/igra");
  await page.getByRole("button", { name: "Сохранить партию" }).click();
  await expect(page.locator(".game-intention")).toHaveText(INTENTION);
  await page.reload();
  await expect(page.getByText("1 ход", { exact: true })).toBeVisible();

  await page.goto("/portret");
  await expect(page.getByRole("region", { name: "Мои партии" })).toContainText(INTENTION);
  await context.close();
});

test("another user cannot open a saved game, and deleting data removes it", async ({ browser }) => {
  const name = uniqueName("Владелица");
  const { context, page } = await signIn(browser, name);
  await start(page);
  await ownRoll(page, 6);
  const gameId = await page.evaluate(async () => {
    const response = await fetch("/api/lila/games/active");
    return ((await response.json()) as { game: { id: string } }).game.id;
  });

  const { context: strangerContext, page: stranger } = await signIn(browser, uniqueName("Чужой"));
  expect((await stranger.goto(`/portret/lila/${gameId}`))?.status()).toBe(404);
  const foreignRoll = await stranger.request.post(`/api/lila/games/${gameId}/roll`, { data: {}, headers: { origin: new URL(stranger.url()).origin } });
  expect(foreignRoll.status()).toBe(404);
  expect((await stranger.request.get(`/api/lila/games/${gameId}`)).status()).toBe(404);
  await strangerContext.close();

  await page.goto("/portret");
  await page.getByRole("link", { name: "Удалить мои данные" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Удалить навсегда" }).click();
  await expect(page).toHaveURL(/\/\?deleted=1$/);

  await page.goto(`/api/dev/login?name=${encodeURIComponent(name)}`);
  expect((await page.goto(`/portret/lila/${gameId}`))?.status()).toBe(404);
  await context.close();
});

test("a guest cannot use the game API", async ({ request }) => {
  expect((await request.get("/api/lila/games/active")).status()).toBe(401);
});

test("the game page is not indexed and the cell pages are in the sitemap", async ({ page, request }) => {
  await page.goto("/lila/igra");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/lila/kletki/12-zavist");
  expect(sitemap).not.toContain("/lila/igra");
});
