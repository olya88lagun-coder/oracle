import { describe, expect, test } from "vitest";
import { BODY_NAMES, natalPageBySlug, natalPageFile, natalPageName, natalPageOrder, natalPageSlug, NATAL_PAGES, SIGN_IDS, SIGN_NAMES } from "./natal-manifest";

describe("natal manifest", () => {
  test("has 132 unique slugs made of latin letters and dashes", () => {
    expect(NATAL_PAGES).toHaveLength(132);
    expect(new Set(NATAL_PAGES.map((page) => page.slug)).size).toBe(132);
    for (const page of NATAL_PAGES) expect(page.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  test("every sign has ten planets and the ascendant", () => {
    for (const sign of SIGN_IDS) {
      const bodies = NATAL_PAGES.filter((page) => page.sign === sign).map((page) => page.body);
      expect(bodies).toHaveLength(11);
      expect(new Set(bodies).size).toBe(11);
      expect(bodies).toContain("ascendant");
    }
    expect(SIGN_IDS).toHaveLength(12);
  });

  test("slugs follow the examples of the plan, with «во» before «Льве»", () => {
    expect(natalPageSlug("sun", "aries")).toBe("solntse-v-ovne");
    expect(natalPageSlug("moon", "taurus")).toBe("luna-v-teltse");
    expect(natalPageSlug("mercury", "gemini")).toBe("merkuriy-v-bliznetsah");
    expect(natalPageSlug("venus", "cancer")).toBe("venera-v-rake");
    expect(natalPageSlug("mars", "leo")).toBe("mars-vo-lve");
    expect(natalPageSlug("jupiter", "virgo")).toBe("yupiter-v-deve");
    expect(natalPageSlug("saturn", "libra")).toBe("saturn-v-vesah");
    expect(natalPageSlug("uranus", "scorpio")).toBe("uran-v-skorpione");
    expect(natalPageSlug("neptune", "sagittarius")).toBe("neptun-v-streltse");
    expect(natalPageSlug("pluto", "capricorn")).toBe("pluton-v-kozeroge");
    expect(natalPageSlug("ascendant", "aquarius")).toBe("ascendent-v-vodolee");
  });

  test("natalPageBySlug works in both directions", () => {
    for (const page of NATAL_PAGES) {
      expect(natalPageBySlug(page.slug)).toBe(page);
      expect(natalPageSlug(page.body, page.sign)).toBe(page.slug);
    }
    expect(natalPageBySlug("net-takoy")).toBeUndefined();
  });

  test("batches hold 36, 36, 24 and 36 pages as planned", () => {
    const count = (batch: number) => NATAL_PAGES.filter((page) => page.batch === batch).length;
    expect([count(1), count(2), count(3), count(4)]).toEqual([36, 36, 24, 36]);
    expect(NATAL_PAGES.filter((page) => page.batch === 1).every((page) => ["sun", "moon", "ascendant"].includes(page.body))).toBe(true);
  });

  test("names read as «Солнце в Овне» and «Марс во Льве»", () => {
    expect(natalPageName("sun", "aries")).toBe("Солнце в Овне");
    expect(natalPageName("mars", "leo")).toBe("Марс во Льве");
    expect(natalPageName("ascendant", "pisces")).toBe("Асцендент в Рыбах");
    expect(Object.keys(SIGN_NAMES)).toHaveLength(12);
    expect(Object.keys(BODY_NAMES)).toHaveLength(11);
  });

  test("file names and order go 001…132 in manifest order", () => {
    expect(natalPageOrder("solntse-v-ovne")).toBe(1);
    expect(natalPageFile("solntse-v-ovne")).toBe("001-solntse-v-ovne.md");
    expect(natalPageOrder("pluton-v-rybah")).toBe(132);
  });
});
