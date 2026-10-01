import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web: документы публичные
const DOCUMENTS = [
  { path: "/contacts", title: "Контакты", label: "Контакты" },
  { path: "/privacy", title: "Политика обработки персональных данных", label: "Политика обработки данных" },
  { path: "/oferta", title: "Публичная оферта", label: "Оферта" },
  { path: "/consent", title: "Согласие на обработку персональных данных", label: "Согласие" },
] as const;

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

for (const document of DOCUMENTS) {
  test(`${document.path}: one h1, a navigation across the four documents and no horizontal scroll`, async ({ page }) => {
    await page.goto(document.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(document.title);
    const nav = page.getByRole("navigation", { name: "Контакты и документы" });
    await expect(nav.getByRole("link")).toHaveCount(4);
    await expect(nav.getByRole("link", { name: document.label, exact: true })).toHaveAttribute("aria-current", "page");
    await noHorizontalScroll(page);
  });
}

test("on a phone the contents list folds, jumps to a section and closes", async ({ page }) => {
  await page.goto("/privacy");
  const toc = page.locator("details.mobile-toc");
  await expect(toc).not.toHaveAttribute("open", "");
  await toc.getByText("Содержание").click();
  await expect(toc).toHaveAttribute("open", "");
  await toc.getByRole("link", { name: "6. Кому передаются" }).click();
  await expect(page).toHaveURL(/#section-6$/);
  await expect(page.getByRole("heading", { level: 2, name: "6. Кому передаются" })).toBeInViewport();
  await expect(toc).not.toHaveAttribute("open", "");
});

test("on a wide screen the side contents mark the current section and the mail link is there", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/privacy");
  const side = page.getByRole("navigation", { name: "Оглавление", exact: true });
  await expect(side.getByRole("link")).toHaveCount(10);
  await side.getByRole("link", { name: "8. Ваши права" }).click();
  await expect(side.getByRole("link", { name: "8. Ваши права" })).toHaveAttribute("aria-current", "location");
  await expect(page.getByRole("link", { name: "Написать нам" })).toHaveAttribute("href", /^mailto:/);
  await page.getByRole("link", { name: "К началу" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
});
