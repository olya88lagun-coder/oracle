import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { QUICK_PAGES } from "@/lib/natal-quick-pages";
import { NatalAnswer } from "./NatalAnswer";
import { NatalQuickGuide } from "./NatalQuickGuide";
import { NatalResult } from "./NatalResult";
import { SAMPLE_BIRTH, sampleChart } from "./sample-chart.test-support";

const withTime = sampleChart(true);
const noTime = sampleChart(false);
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

describe("NatalQuickGuide", () => {
  for (const variant of ["ascendant", "moon"] as const) {
    describe(variant, () => {
      const markup = renderToStaticMarkup(<NatalQuickGuide variant={variant} />);
      const page = QUICK_PAGES[variant];

      test("shows every section of the page, its FAQ and no h1", () => {
        for (const section of page.sections) expect(markup).toContain(`<h2>${section.title}</h2>`);
        for (const item of page.faq) expect(markup.split(item.question)).toHaveLength(2);
        expect(markup).not.toMatch(/<h1/);
        expect(markup.match(/<details open/g)).toHaveLength(1);
      });

      test("links the twelve meaning pages of its own body, and no page of another body", () => {
        const body = variant === "moon" ? "luna" : "ascendent";
        const links = markup.match(new RegExp(`href="/natalnaya-karta/${body}-v[o]?-[a-z]+"`, "g")) ?? [];
        expect(links).toHaveLength(12);
        const other = variant === "moon" ? "ascendent-v" : "luna-v";
        expect(markup).not.toContain(`/natalnaya-karta/${other}`);
      });

      test("leads to the full calculator, the methodology and the other quick page", () => {
        expect(markup).toContain('href="/natalnaya-karta"');
        expect(markup).toContain('href="/metodika"');
        expect(markup).toContain(variant === "moon" ? 'href="/natalnaya-karta/ascendent"' : 'href="/natalnaya-karta/lunnyy-znak"');
      });
    });
  }
});

describe("NatalAnswer", () => {
  test("shows the title, the degrees and the text for the ascendant", () => {
    const markup = renderToStaticMarkup(<NatalAnswer chart={withTime} variant="ascendant" registry={{}} />);
    expect(text(markup)).toContain("Ваш результат Асцендент в Раке 14°08′");
    expect(markup).not.toContain("natal-answer__link");
  });

  test("links the meaning page when it is published", () => {
    const markup = renderToStaticMarkup(<NatalAnswer chart={withTime} variant="moon" registry={{ "moon-cancer": { summary: "x", href: "/natalnaya-karta/luna-v-rake" } }} />);
    expect(markup).toContain('href="/natalnaya-karta/luna-v-rake"');
    expect(text(markup)).toContain("Значение: Луна в Раке");
  });

  test("without the time the ascendant is not named and the Moon is warned about", () => {
    expect(text(renderToStaticMarkup(<NatalAnswer chart={noTime} variant="ascendant" registry={{}} />))).toContain("Асцендент определить нельзя");
    const moon = renderToStaticMarkup(<NatalAnswer chart={{ ...noTime, uncertainSigns: ["moon"] }} variant="moon" registry={{}} />);
    expect(text(moon)).toContain("мог быть другим");
    expect(moon).not.toContain("natal-answer__detail");
  });
});

describe("NatalResult with an answer", () => {
  test("puts the answer above the wheel, and nothing on the ordinary page", () => {
    const quick = renderToStaticMarkup(<NatalResult chart={withTime} birth={SAMPLE_BIRTH} answer="ascendant" />);
    expect(quick.indexOf("natal-answer")).toBeGreaterThan(0);
    expect(quick.indexOf("natal-answer")).toBeLessThan(quick.indexOf("natal-result__details"));
    expect(renderToStaticMarkup(<NatalResult chart={withTime} birth={SAMPLE_BIRTH} />)).not.toContain("natal-answer");
  });
});
