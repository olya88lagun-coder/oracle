import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueName } from "./helpers";

async function calculate(page: Page, iso: string) {
  await page.getByRole("textbox", { name: "Дата рождения" }).fill(iso);
  await page.getByRole("button", { name: "Рассчитать" }).click();
}

const result = (page: Page) => page.getByRole("region", { name: "Ваша матрица судьбы" });

test("the home page leads to the open matrix calculator", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Матрица судьбы" }).click();

  await expect(page).toHaveURL(/\/matrica-sudby$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Матрица судьбы по дате рождения");
});

test("a visitor gets the matrix without login and the browser remembers the date", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await calculate(page, "1988-11-18");

  await expect(result(page).getByRole("heading", { name: "Аркан 18, Луна" })).toBeVisible();
  await expect(result(page).getByRole("heading", { name: "Аркан 11, Сила" })).toBeVisible();
  await expect(result(page).getByRole("heading", { name: "Аркан 10, Колесо Фортуны" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Войти и сохранить" })).toHaveAttribute("href", "/login?next=%2Fmatrica-sudby");

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Дата рождения" })).toHaveValue("1988-11-18");
  await expect(result(page).getByRole("heading", { name: "Аркан 11, Сила" })).toBeVisible();
  expect(page.url()).not.toContain("1988");
});

test("an impossible date is refused with a clear message", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await calculate(page, "2099-01-01");

  await expect(page.getByRole("alert").filter({ hasText: "не позже сегодняшней" })).toBeVisible();
  await expect(result(page)).toHaveCount(0);
});

test("«Войти и сохранить» brings the person back and saves the date into an empty portrait", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await calculate(page, "1988-11-18");
  await page.getByRole("link", { name: "Войти и сохранить" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fmatrica-sudby$/);

  // VK ID на localhost недоступен — dev-вход повторяет возврат со входа с тем же next
  await page.goto(`/api/dev/login?name=${encodeURIComponent(uniqueName("Лея"))}&next=/matrica-sudby`);
  await expect(page).toHaveURL(/\/matrica-sudby/);
  await expect(page.locator(".save-block").getByRole("status")).toHaveText("Сохранено.");

  await page.goto("/portret");
  await expect(page.getByText("18 ноября 1988")).toBeVisible();
  await expect(page.getByText("Центр · Сила")).toBeVisible();
});

test("the portrait date wins over another date in the browser", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Ира"));
  await page.getByRole("textbox", { name: "Дата рождения" }).fill("1990-05-14");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("status")).toHaveText("Сохранено.");

  await page.evaluate(() => localStorage.setItem("oracle-birth-date", "1988-11-18"));
  await page.goto("/matrica-sudby");

  await expect(page.getByRole("textbox", { name: "Дата рождения" })).toHaveValue("1990-05-14");
  await expect(page.locator(".save-block").getByRole("status")).toHaveText("Сохранено.");
  await context.close();
});

test("deleting the data also clears the browser copy of the date", async ({ browser }) => {
  const { context, page } = await signIn(browser, uniqueName("Ната"));
  await page.goto("/matrica-sudby");
  await calculate(page, "1977-07-23");
  await expect(result(page)).toBeVisible();

  await page.goto("/portret/delete");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Удалить навсегда" }).click();
  await expect(page).toHaveURL(/\/\?deleted=1$/);

  expect(await page.evaluate(() => localStorage.getItem("oracle-birth-date"))).toBeNull();
  await context.close();
});

test("an arcanum page is indexable and leads to the calculator", async ({ page }) => {
  await page.goto("/matrica-sudby/arkan-11-sila");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Сила");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);

  await page.getByRole("link", { name: "Рассчитать свою матрицу" }).first().click();
  await expect(page).toHaveURL(/\/matrica-sudby$/);
});

test("an unknown arcanum address is a 404", async ({ request }) => {
  expect((await request.get("/matrica-sudby/arkan-11-mag")).status()).toBe(404);
  expect((await request.get("/matrica-sudby/arkan-23-x")).status()).toBe(404);
});

// Guards the controller's fix in MatrixCalculator.tsx: recalculating with an invalid date
// must drop the previous result instead of leaving it next to the new error.
test("recalculating with an impossible date drops the previous result", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await calculate(page, "1988-11-18");
  await expect(result(page)).toBeVisible();

  await calculate(page, "2099-01-01");

  await expect(page.getByRole("alert").filter({ hasText: "не позже сегодняшней" })).toBeVisible();
  await expect(result(page)).toHaveCount(0);
});
