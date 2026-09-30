import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web: страница публичная, вход не требуется
async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function calculate(page: Page, first = "1988-11-18", second = "2000-01-01") {
  await page.goto("/sovmestimost");
  // Клик до гидратации отправляет форму обычным способом и перезагружает страницу: повторяем ввод, пока результат не появится
  await expect(async () => {
    await page.getByLabel("Ваша дата рождения").fill(first);
    await page.getByLabel("Дата рождения партнёра").fill(second);
    await page.getByRole("button", { name: "Рассчитать совместимость" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Аркан вашей пары" })).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 25_000 });
}

test("two dates give the pair arcanum, the two people and the summary, and the dates stay out of the address", async ({ page }) => {
  await calculate(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Совместимость по дате рождения");
  await expect(page.getByRole("heading", { level: 2, name: "Вы и партнёр" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Где вы похожи и где различаетесь" })).toBeVisible();
  expect(page.url()).not.toMatch(/1988|2000/);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toMatch(/1988|2000-01-01/);
  await noHorizontalScroll(page);
});

test("a wrong date shows an alert and no result", async ({ page }) => {
  await page.goto("/sovmestimost");
  await expect(async () => {
    await page.getByLabel("Ваша дата рождения").fill("1988-11-18");
    await page.getByRole("button", { name: "Рассчитать совместимость" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("Проверьте даты", { timeout: 3000 });
  }).toPass({ timeout: 25_000 });
  await expect(page.getByRole("heading", { level: 2, name: "Аркан вашей пары" })).toHaveCount(0);
});

test("the invitation copies a link without dates when the system share dialog is not available", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (text: string) => ((window as unknown as { __copied: string }).__copied = text) }, configurable: true });
  });
  await calculate(page);
  await page.getByRole("button", { name: "Отправить партнёру" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ссылка скопирована." })).toBeVisible();
  const copied = await page.evaluate(() => (window as unknown as { __copied: string }).__copied);
  expect(copied).toContain("/sovmestimost?utm_source=share&utm_medium=partner");
  expect(copied).not.toMatch(/1988|2000/);
});

test("the PDF downloads and is a real PDF; «Пересчитать» clears the result", async ({ page }) => {
  await calculate(page);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Скачать PDF" }).click()]);
  expect(download.suggestedFilename()).toBe("sovmestimost.pdf");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  expect(Buffer.concat(chunks).subarray(0, 5).toString()).toBe("%PDF-");
  await page.getByRole("button", { name: "Пересчитать" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Аркан вашей пары" })).toHaveCount(0);
});

test("the PDF endpoint refuses foreign origins and bad dates", async ({ page }) => {
  await page.goto("/sovmestimost");
  const origin = new URL(page.url()).origin;
  expect((await page.request.post("/api/compat/pdf", { data: { a: "1988-11-18", b: "2000-01-01" }, headers: { origin: "https://evil.example" } })).status()).toBe(403);
  expect((await page.request.post("/api/compat/pdf", { data: { a: "нет", b: "2000-01-01" }, headers: { origin } })).status()).toBe(400);
});

test("the matrix result offers to check the compatibility", async ({ page }) => {
  await page.goto("/matrica-sudby");
  await page.getByRole("textbox", { name: "Дата рождения" }).fill("1988-11-18");
  await page.getByRole("button", { name: "Рассчитать", exact: true }).click();
  await expect(page.getByRole("link", { name: "Проверить совместимость с партнёром" })).toHaveAttribute("href", "/sovmestimost");
});
