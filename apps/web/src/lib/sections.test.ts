import { describe, expect, test } from "vitest";
import { SECTIONS } from "./sections";
import { PUBLIC_PATHS } from "./seo";

describe("SECTIONS", () => {
  test("lists the practices and the blog in the order of the header", () => {
    expect(SECTIONS.map((section) => section.short)).toEqual(["Матрица", "Совместимость", "Лила", "Таро", "Блог"]);
  });

  test("every section leads to a public page", () => {
    for (const section of SECTIONS) expect(PUBLIC_PATHS).toContain(section.href);
  });
});
