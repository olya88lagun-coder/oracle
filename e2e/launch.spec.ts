import { expect, test } from "@playwright/test";
import { BASE_URL } from "./helpers";

test("public pages are indexable and private pages are not", async ({ page }) => {
  for (const path of ["/", "/matrica-sudby", "/matrica-sudby/arkan-11-sila", "/privacy", "/consent", "/contacts"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  }
  for (const path of ["/login", "/portret"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  }
});

test("robots.txt and sitemap.xml describe the public site", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  const sitemap = await (await request.get("/sitemap.xml")).text();

  expect(robots).toContain("Disallow: /portret");
  expect(robots).toContain("Sitemap:");
  expect(sitemap).toContain("/privacy");
  expect(sitemap).toContain("/matrica-sudby/arkan-22-shut");
  expect(sitemap).not.toContain("/portret");
});

test("every page carries the disclaimer and the document links", async ({ page }) => {
  await page.goto("/contacts");
  const footer = page.locator("footer");

  await expect(footer).toContainText("не предсказания");
  await expect(footer.getByRole("link", { name: "Политика обработки данных" })).toBeVisible();
});

test("the cookie banner asks once and can be reopened from the footer", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/`);
  const banner = page.getByRole("dialog", { name: "Cookie" });

  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Только необходимые" }).click();
  await expect(banner).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem("oracle-cookie-consent"))).toBe("necessary");

  await page.reload();
  await expect(banner).toBeHidden();
  await page.getByRole("button", { name: "Настройки cookie" }).click();
  await expect(banner).toBeVisible();
  await context.close();
});

test("state-changing endpoints refuse requests from other sites", async ({ request }) => {
  for (const path of ["/api/consent", "/api/profile/birth-date", "/api/me/delete", "/api/auth/logout"]) {
    const response = await request.post(path, { headers: { origin: "https://evil.test" }, data: {} });
    expect(response.status(), path).toBe(403);
  }
});
