import { expect, test } from "@playwright/test";

const templates = ["/", "/lila", "/lila/igra", "/lila/primer", "/matrica-sudby/primer", "/metodika", "/sovmestimost", "/blog/lila-s-ii-provodnikom"];

test("audit additions render on phone and desktop with one main heading", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of templates) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${path} at ${width}`).toBe(true);
      if (path === "/lila" && width === 375) await page.screenshot({ path: "e2e/test-results/lila-modes-375.png", fullPage: true });
      if (path === "/matrica-sudby/primer" && width === 1440) await page.screenshot({ path: "e2e/test-results/matrix-example-1440.png", fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});

test("all changed cell and card pages remain usable on a phone", async ({ page, request }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 375, height: 844 });
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]!).pathname).filter((path) => path.startsWith("/lila/kletki/") || path.startsWith("/taro/karty/"));
  expect(paths).toHaveLength(150);
  for (const path of paths) {
    expect((await page.goto(path))?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true);
    if (path.startsWith("/lila/")) {
      await expect(page.getByRole("heading", { name: "Пример из повседневности" })).toBeVisible();
      const related = page.locator("#primer a").last();
      expect((await request.get((await related.getAttribute("href"))!)).status()).toBe(200);
    }
  }
});

test("public PDF examples download without opening private report APIs", async ({ page, request }) => {
  for (const [path, file] of [["/matrica-sudby/primer", "matrix.pdf"], ["/lila/primer", "lila.pdf"]]) {
    await page.goto(path!);
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Скачать пример PDF" }).click();
    expect((await download).suggestedFilename()).toBe(file);
  }
  expect((await request.get("/api/reports/00000000-0000-0000-0000-000000000000/pdf")).status()).toBe(401);
});
