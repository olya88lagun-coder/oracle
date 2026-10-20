import { ACCEPTED_BATCHES, NATAL_PAGES } from "@oracle/content/natal";
import { describe, expect, test } from "vitest";
import { acceptedNatalPage, acceptedNatalPages, neighborPages, sameBodyPages } from "./natal-pages";

describe("accepted natal pages", () => {
  test("are exactly the pages of the accepted batches, each with a text", () => {
    const pages = acceptedNatalPages();
    expect(pages).toHaveLength(NATAL_PAGES.filter((page) => ACCEPTED_BATCHES.has(page.batch)).length);
    expect(pages.every((page) => ACCEPTED_BATCHES.has(page.batch))).toBe(true);
    // Партия 1 принята всегда: Солнце, Луна и асцендент во всех знаках
    const first = pages.filter((page) => page.batch === 1);
    expect(first).toHaveLength(36);
    expect(new Set(first.map((page) => page.body))).toEqual(new Set(["sun", "moon", "ascendant"]));
  });

  test("a page of a batch that is not accepted, or an unknown address, is not found", () => {
    expect(acceptedNatalPage("solntse-v-ovne")?.sign).toBe("aries");
    const closed = NATAL_PAGES.find((page) => !ACCEPTED_BATCHES.has(page.batch));
    if (closed) expect(acceptedNatalPage(closed.slug), closed.slug).toBeUndefined();
    expect(acceptedNatalPage("net-takoy-stranitsy")).toBeUndefined();
    expect(acceptedNatalPage("")).toBeUndefined();
  });

  test("neighbours go round the zodiac: before Aries is Pisces, after Pisces is Aries", () => {
    const sunAries = acceptedNatalPage("solntse-v-ovne");
    const sunPisces = acceptedNatalPage("solntse-v-rybah");
    expect(sunAries && neighborPages(sunAries).previous?.slug).toBe("solntse-v-rybah");
    expect(sunAries && neighborPages(sunAries).next?.slug).toBe("solntse-v-teltse");
    expect(sunPisces && neighborPages(sunPisces).next?.slug).toBe("solntse-v-ovne");
    const ascLeo = acceptedNatalPage("ascendent-vo-lve");
    expect(ascLeo && neighborPages(ascLeo).previous?.slug).toBe("ascendent-v-rake");
    expect(ascLeo && neighborPages(ascLeo).next?.slug).toBe("ascendent-v-deve");
  });

  test("the same body is listed in all twelve signs in zodiac order, and only that body", () => {
    const moon = acceptedNatalPage("luna-v-rake");
    const list = moon ? sameBodyPages(moon) : [];
    expect(list).toHaveLength(12);
    expect(list.every((page) => page.body === "moon")).toBe(true);
    expect(list.map((page) => page.sign)[0]).toBe("aries");
    expect(list.map((page) => page.sign)[11]).toBe("pisces");
  });
});
