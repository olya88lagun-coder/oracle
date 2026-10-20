import { ACCEPTED_BATCHES, natalPageBySlug, NATAL_PAGES, SIGN_IDS } from "@oracle/content/natal";
import { describe, expect, test } from "vitest";
import { acceptedNatalPage, acceptedNatalPages, neighborPages, nodeAxisFor, oppositeSign, sameBodyPages } from "./natal-pages";

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

describe("axis of the lunar nodes", () => {
  test("the south node is always six signs away from the north one, in both directions", () => {
    expect(oppositeSign("aries")).toBe("libra");
    expect(oppositeSign("leo")).toBe("aquarius");
    expect(oppositeSign("pisces")).toBe("virgo");
    for (const sign of SIGN_IDS) expect(oppositeSign(oppositeSign(sign))).toBe(sign);
  });

  test("exists only for north node pages and points at the mirror page when it is open", () => {
    const aries = natalPageBySlug("severnyy-uzel-v-ovne");
    const sun = natalPageBySlug("solntse-v-ovne");
    expect(sun && nodeAxisFor(sun)).toBeNull();
    expect(aries && nodeAxisFor(aries, () => true)).toMatchObject({ north: "aries", south: "libra", mirror: { slug: "severnyy-uzel-v-vesah" } });
    expect(aries && nodeAxisFor(aries, () => false)?.mirror).toBeUndefined();
  });

  test("while batch 5 is closed no node page is open, so there is no link to a mirror page", () => {
    const aries = natalPageBySlug("severnyy-uzel-v-ovne");
    if (!ACCEPTED_BATCHES.has(5)) expect(aries && nodeAxisFor(aries)?.mirror).toBeUndefined();
  });
});
