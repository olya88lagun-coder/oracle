import { findStopPhrases } from "@oracle/content";
import { describe, expect, test } from "vitest";
import { sampleChart } from "@/components/natal/sample-chart.test-support";
import { QUICK_PAGES, QUICK_VARIANTS, quickAnswer, quickFaqJsonLd, quickPageText } from "./natal-quick-pages";

const withTime = sampleChart(true);
const noTime = sampleChart(false);

describe("QUICK_PAGES", () => {
  test("has an ascendant page and a moon sign page with their own addresses under the calculator", () => {
    expect(QUICK_VARIANTS).toEqual(["ascendant", "moon"]);
    expect(QUICK_PAGES.ascendant.path).toBe("/natalnaya-karta/ascendent");
    expect(QUICK_PAGES.moon.path).toBe("/natalnaya-karta/lunnyy-znak");
  });

  test("each page has its own title, heading, description within a snippet and enough text of its own", () => {
    const titles = QUICK_VARIANTS.map((variant) => QUICK_PAGES[variant].metaTitle);
    expect(new Set(titles).size).toBe(2);
    for (const variant of QUICK_VARIANTS) {
      const page = QUICK_PAGES[variant];
      expect(page.description.length).toBeLessThanOrEqual(170);
      expect(page.description.length).toBeGreaterThan(80);
      expect(page.h1.length).toBeGreaterThan(10);
      expect(quickPageText(variant).split(/\s+/).length).toBeGreaterThan(350);
    }
  });

  test("the pages do not copy each other: no shared section title and no shared paragraph", () => {
    const sectionTitles = (variant: "ascendant" | "moon") => QUICK_PAGES[variant].sections.map((section) => section.title);
    const paragraphs = (variant: "ascendant" | "moon") => QUICK_PAGES[variant].sections.flatMap((section) => section.paragraphs);
    for (const title of sectionTitles("ascendant")) expect(sectionTitles("moon")).not.toContain(title);
    for (const paragraph of paragraphs("ascendant")) expect(paragraphs("moon")).not.toContain(paragraph);
  });

  test("never predicts or promises, in any text of the pages", () => {
    for (const variant of QUICK_VARIANTS) {
      const text = quickPageText(variant);
      expect(findStopPhrases(text), variant).toEqual([]);
      expect(text, variant).not.toMatch(/будет|ждёт|судьб|обязательно|всегда|никогда|гарант/i);
    }
  });

  test("every FAQ has an answer and the JSON-LD repeats the visible questions", () => {
    for (const variant of QUICK_VARIANTS) {
      const faq = QUICK_PAGES[variant].faq;
      expect(faq.length).toBeGreaterThanOrEqual(4);
      for (const item of faq) expect(item.answer.length).toBeGreaterThan(40);
      const ld = quickFaqJsonLd(variant);
      expect(ld["@type"]).toBe("FAQPage");
      expect((ld.mainEntity as { name: string }[]).map((entity) => entity.name)).toEqual(faq.map((item) => item.question));
    }
  });
});

describe("quickAnswer", () => {
  test("ascendant: names the sign and the degrees from the chart, and links the meaning page when it is published", () => {
    const answer = quickAnswer(withTime, "ascendant", { "ascendant-cancer": { summary: "x", href: "/natalnaya-karta/ascendent-v-rake" } });
    expect(answer.title).toBe("Асцендент в Раке");
    expect(answer.detail).toBe("14°08′"); // у образца асцендент 104,13°; на живой карте Москвы — 14°07′
    expect(answer.link).toEqual({ href: "/natalnaya-karta/ascendent-v-rake", label: "Значение: Асцендент в Раке" });
    expect(quickAnswer(withTime, "ascendant", {}).link).toBeNull();
  });

  test("ascendant without the birth time: no sign, only the explanation of what is needed", () => {
    const answer = quickAnswer(noTime, "ascendant", {});
    expect(answer.title).toBe("Асцендент определить нельзя");
    expect(answer.text).toContain("время рождения");
    expect(answer.detail).toBeNull();
  });

  test("moon: names the sign and the degrees and links the meaning page", () => {
    const answer = quickAnswer(withTime, "moon", { "moon-cancer": { summary: "x", href: "/natalnaya-karta/luna-v-rake" } });
    expect(answer.title).toBe("Луна в Раке");
    expect(answer.detail).toBe("28°07′");
    expect(answer.link?.href).toBe("/natalnaya-karta/luna-v-rake");
  });

  test("moon without the time: still names the sign for noon but warns that it could have been another", () => {
    const uncertain = { ...noTime, uncertainSigns: ["moon" as const] };
    const answer = quickAnswer(uncertain, "moon", {});
    expect(answer.title).toMatch(/^Луна (в|во) /);
    expect(answer.detail).toBeNull();
    expect(answer.note).toContain("Луна");
    expect(answer.note).toMatch(/время/);
  });

  test("moon without the time and with a stable sign: says the date is enough this time", () => {
    const stable = { ...noTime, uncertainSigns: [] };
    expect(quickAnswer(stable, "moon", {}).note).toMatch(/по одной дате|достаточно/);
  });
});
