import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web. Пока партия 8 не принята, страницы нет (404) — тесты пропускаются
const PATH = "/numerologiya/kvadrat-pifagora/sovmestimost";

async function open(page: Page) {
  const response = await page.goto(PATH);
  test.skip(response?.status() === 404, "партия 8 ещё не принята");
}

async function compare(page: Page, you: string, partner: string) {
  // Клик до гидратации отправляет форму обычным способом: повторяем, пока не появится результат или ошибка
  await expect(async () => {
    await page.getByLabel("Ваша дата рождения").fill(you);
    await page.getByLabel("Дата рождения партнёра").fill(partner);
    await page.getByRole("button", { name: "Сравнить квадраты" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Ваши квадраты Пифагора" }).or(page.locator('p[role="alert"]'))).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 25_000 });
}

test("two dates give the pair square, focus on the result, and the dates stay in the browser", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(`${request.url()} ${request.postData() ?? ""}`));
  await open(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Совместимость по квадрату Пифагора");
  await compare(page, "1987-05-14", "1976-03-07");
  await expect(page.getByRole("heading", { level: 2, name: "Ваши квадраты Пифагора" })).toBeFocused();
  await expect(page.getByRole("table", { name: "Общий квадрат пары: цифры по ячейкам" })).toBeVisible();
  for (const name of ["Где вы похожи", "Где различаетесь", "Линии пары"]) await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
  expect(page.url()).not.toMatch(/1987|1976/);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toMatch(/1987|1976/);
  expect(requests.filter((line) => /1987|1976|14\.05|07\.03/.test(line))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("a wrong partner date: alert at the partner field, focus there, the first date kept", async ({ page }) => {
  await open(page);
  await compare(page, "1987-05-14", "2999-01-01");
  const partner = page.getByLabel("Дата рождения партнёра");
  await expect(partner).toBeFocused();
  await expect(partner).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Ваша дата рождения")).toHaveValue("1987-05-14");
  await expect(page.getByRole("heading", { level: 2, name: "Ваши квадраты Пифагора" })).toHaveCount(0);
});
