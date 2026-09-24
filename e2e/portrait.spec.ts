import { expect, test } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

test("a visitor goes from the home page to the portrait and is invited to sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Иногда нужен не ответ");
  await expect(page.getByText("Скоро")).toHaveCount(4);

  await page.getByRole("link", { name: "Открыть портрет" }).click();

  await expect(page).toHaveURL(/\/portret$/);
  await expect(page.getByRole("link", { name: "Войти через VK ID" })).toBeVisible();
});

test("the login button waits for consent", async ({ page }) => {
  await page.goto("/login");
  const button = page.getByRole("button", { name: "Войти через VK ID" });

  await expect(button).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(button).toBeEnabled();
});

test("a signed-in user saves the birth date and sees it after a reload", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Аня"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Здравствуйте, Аня");

  await page.getByRole("textbox", { name: "Дата рождения" }).fill("1990-03-07");
  await page.getByRole("button", { name: "Сохранить" }).click();

  await expect(page.getByRole("status")).toHaveText("Сохранено.");
  await page.reload();
  await expect(page.getByText("7 марта 1990")).toBeVisible();
  await context.close();
});

test("a future date is refused with a clear message", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Боря"));

  await page.getByRole("textbox", { name: "Дата рождения" }).fill("2099-01-01");
  await page.getByRole("button", { name: "Сохранить" }).click();

  // Next.js рендерит на каждой странице свой div[role="alert"] (анонс переходов для скринридеров) — фильтруем по тексту
  await expect(page.getByRole("alert").filter({ hasText: "не позже сегодняшней" })).toBeVisible();
  await context.close();
});

test("deleting the data ends the session and a new login starts an empty portrait", async ({ browser }) => {
  const name = uniqueName("Вера");
  const { context, page } = await signIn(browser, name);
  await page.getByRole("textbox", { name: "Дата рождения" }).fill("1985-12-31");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("status")).toHaveText("Сохранено.");

  await page.getByRole("link", { name: "Удалить мои данные" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Удалить навсегда" }).click();

  await expect(page).toHaveURL(/\/\?deleted=1$/);
  await page.goto("/portret");
  await expect(page.getByRole("link", { name: "Войти через VK ID" })).toBeVisible();

  await page.goto(`/api/dev/login?name=${encodeURIComponent(name)}`);
  await expect(page.getByText("31 декабря 1985")).toHaveCount(0);
  await context.close();
});

test("logging out returns to the home page", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Гоша"));

  await page.getByRole("button", { name: "Выйти" }).click();

  await expect(page).toHaveURL(/\/$/);
  await page.goto("/portret");
  await expect(page.getByRole("link", { name: "Войти через VK ID" })).toBeVisible();
  await context.close();
});
