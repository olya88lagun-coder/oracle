import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

// Навигация клиентская (pathname); для проверки знака шапки её достаточно заглушить
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const { Header } = await import("./Header");
const markup = renderToStaticMarkup(<Header />);

describe("Header", () => {
  test("uses the logo mark as the home link with the site name as accessible name", () => {
    expect(markup).toContain('href="/"');
    expect(markup).toContain('aria-label="Твой оракул"');
    expect(markup).toContain('class="site-logo"');
    expect(markup).toContain('class="site-logo__mark"');
    expect(markup).not.toMatch(/class="wordmark"[^>]*>\s*Твой/);
  });
});
