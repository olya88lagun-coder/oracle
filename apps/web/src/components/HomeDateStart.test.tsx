import { describe, expect, test, vi } from "vitest";
import { parseHomeBirthInput } from "./HomeDateStart";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("parseHomeBirthInput", () => {
  const today = new Date("2026-11-25T12:00:00Z");

  test("accepts Russian dd.mm.yyyy and returns ISO for the matrix handoff", () => {
    expect(parseHomeBirthInput("07.03.1990", today)).toBe("1990-03-07");
    expect(parseHomeBirthInput("7.3.1990", today)).toBe("1990-03-07");
    expect(parseHomeBirthInput(" 15.01.1990 ", today)).toBe("1990-01-15");
  });

  test("still accepts ISO dates", () => {
    expect(parseHomeBirthInput("1990-03-07", today)).toBe("1990-03-07");
  });

  test("rejects empty, impossible and future dates", () => {
    expect(parseHomeBirthInput("", today)).toBeNull();
    expect(parseHomeBirthInput("31.02.1990", today)).toBeNull();
    expect(parseHomeBirthInput("03/07/1990", today)).toBeNull();
    expect(parseHomeBirthInput("01.01.2027", today)).toBeNull();
  });
});

describe("HomeDateStart markup", () => {
  test("uses a text field with the Russian date placeholder instead of a native date input", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { HomeDateStart } = await import("./HomeDateStart");
    const markup = renderToStaticMarkup(<HomeDateStart />);
    expect(markup).toContain('id="home-birth-date"');
    expect(markup).toContain('type="text"');
    expect(markup).toContain('placeholder="дд.мм.гггг"');
    expect(markup).not.toContain('type="date"');
    expect(markup).toContain("Дата рождения");
  });
});
