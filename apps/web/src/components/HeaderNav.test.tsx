import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const { HeaderNav } = await import("./HeaderNav");
const markup = renderToStaticMarkup(<HeaderNav />);

describe("HeaderNav", () => {
  test("shows five primary practices plus a More overflow on desktop and the full list on mobile", () => {
    expect(markup).toContain('aria-label="Основная навигация"');
    expect(markup).toContain("Ещё");
    expect(markup).toContain('aria-haspopup="menu"');
    expect(markup).toContain('aria-label="Навигация на телефоне"');
    for (const label of ["Матрица", "Лила", "Таро", "Натальная карта", "Луна"]) {
      expect(markup).toContain(label);
    }
    for (const label of ["Совместимость", "Нумерология", "Блог"]) {
      expect(markup).toContain(label);
    }
    // Полные названия — только в мобильном меню
    expect(markup).toContain("Матрица судьбы");
  });
});
