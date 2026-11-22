import { describe, expect, test } from "vitest";
import { isSectionCurrent, SECTIONS } from "./sections";
import { PUBLIC_PATHS } from "./seo";

describe("SECTIONS", () => {
  test("lists the practices and the blog in the order of the header", () => {
    expect(SECTIONS.map((section) => section.short)).toEqual(["Матрица", "Совместимость", "Лила", "Таро", "Натальная карта", "Луна", "Нумерология", "Блог"]);
  });

  test("every section leads to a public page", () => {
    for (const section of SECTIONS) expect(PUBLIC_PATHS).toContain(section.href);
  });

  test("the Moon section is current on every Moon page and the others keep the prefix rule", () => {
    const moon = SECTIONS.find((section) => section.short === "Луна")!;
    for (const path of ["/luna-segodnya", "/lunnyy-kalendar/noyabr-2026", "/luna/fazy-luny", "/luna/sutki/5", "/dni-nedeli"]) expect(isSectionCurrent(path, moon), path).toBe(true);
    for (const path of ["/", "/lila", "/lunatik"]) expect(isSectionCurrent(path, moon), path).toBe(false);
    const lila = SECTIONS.find((section) => section.short === "Лила")!;
    expect(isSectionCurrent("/lila/igra", lila)).toBe(true);
    expect(isSectionCurrent("/luna-segodnya", lila)).toBe(false);
  });
});
