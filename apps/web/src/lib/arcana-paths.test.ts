import { ARCANA } from "@oracle/content";
import { describe, expect, test } from "vitest";
import { arcanumFromParam, arcanumJsonLd, arcanumParam, arcanumPath, MATRIX_PATH } from "./arcana-paths";

const sila = { number: 11, slug: "sila" };

describe("arcanum paths", () => {
  test("build the page address from the number and slug", () => {
    expect(MATRIX_PATH).toBe("/matrica-sudby");
    expect(arcanumParam(sila)).toBe("arkan-11-sila");
    expect(arcanumPath(sila)).toBe("/matrica-sudby/arkan-11-sila");
  });

  test("resolve every published arcanum from its own parameter", () => {
    for (const arcanum of ARCANA) {
      expect(arcanumFromParam(arcanumParam(arcanum))).toBe(arcanum);
    }
  });

  test.each(["arkan-11-mag", "arkan-23-sila", "arkan-11", "sila", "arkan-011-sila", "arkan-11-sila-x"])("reject %s", (param) => {
    expect(arcanumFromParam(param)).toBeNull();
  });
});

describe("arcanumJsonLd", () => {
  test("describes the page as an Article in Russian", () => {
    const arcanum = ARCANA.find((item) => item.number === 11)!;
    const ld = arcanumJsonLd(arcanum, "https://oracle.test");

    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Аркан 11 «Сила» в матрице судьбы",
      inLanguage: "ru",
      mainEntityOfPage: "https://oracle.test/matrica-sudby/arkan-11-sila",
    });
    expect(String(ld.description).length).toBeLessThanOrEqual(160);
  });
});
