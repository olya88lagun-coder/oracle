import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

// Тот же адрес, что в playwright.config.ts
export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

// Имя через пробел: на странице показывается первое слово, а dev-вход различает пользователей по полному имени
export const uniqueName = (prefix: string) => `${prefix} ${Date.now()}${Math.floor(Math.random() * 1000)}`;

export async function signIn(browser: Browser, name: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/api/dev/login?name=${encodeURIComponent(name)}`);
  await expect(page).toHaveURL(/\/portret$/);
  return { context, page };
}
