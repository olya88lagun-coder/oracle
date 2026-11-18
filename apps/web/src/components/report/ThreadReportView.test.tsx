import { THREAD_CHAPTER_IDS, THREAD_CHAPTER_TITLES } from "@oracle/core";
import type { StoredThreadChapter } from "@oracle/db";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ThreadReportView } from "./ThreadReportView";

const chapters: StoredThreadChapter[] = THREAD_CHAPTER_IDS.map((id) => ({
  id,
  source: "fallback",
  blocks: [{ heading: id === "years" ? "2027 · год 6 · забота" : undefined, paragraphs: [`Текст главы ${id}.`] }],
}));
const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe("ThreadReportView", () => {
  const html = renderToStaticMarkup(<ThreadReportView chapters={chapters} birthDate="1990-07-15" />);

  test("one h1, six chapter titles as h2, block heading as h3", () => {
    expect(count(html, /<h1[ >]/g)).toBe(1);
    expect(html).toContain("Разбор нити");
    for (const id of THREAD_CHAPTER_IDS) expect(html).toContain(THREAD_CHAPTER_TITLES[id]);
    expect(count(html, /<h2[ >]/g)).toBeGreaterThanOrEqual(6);
    expect(html).toMatch(/<h3[^>]*>2027 · год 6 · забота<\/h3>/);
  });

  test("table of contents links to each chapter anchor", () => {
    for (const id of THREAD_CHAPTER_IDS) {
      expect(html).toContain(`href="#thread-chapter-${id}"`);
      expect(html).toContain(`id="thread-chapter-${id}"`);
    }
  });

  test("shows the thread picture", () => {
    expect(html).toContain("thread-chart");
  });

  test("no evaluating words", () => {
    for (const word of ["плох", "спад", "приговор"]) expect(html).not.toContain(word);
  });

  test("an empty chapter list renders only the heading and does not crash", () => {
    const empty = renderToStaticMarkup(<ThreadReportView chapters={[]} birthDate="1990-07-15" />);
    expect(count(empty, /<h1[ >]/g)).toBe(1);
    expect(empty).not.toContain("<h3");
  });

  test("a broken date skips the picture", () => {
    const bad = renderToStaticMarkup(<ThreadReportView chapters={chapters} birthDate="nope" />);
    expect(bad).not.toContain("thread-chart");
  });

  test("the chart's current year follows `today`, not the real clock", () => {
    const label = (today: Date) => renderToStaticMarkup(<ThreadReportView chapters={chapters} birthDate="1990-07-15" today={today} />).match(/Вы здесь · год (\d)/)?.[1];
    // личный год 15.07.1990: 2026 → 5, 2027 → 6; разбор куплен в 2026, смотреть его можно позже
    expect(label(new Date("2026-11-18T12:00:00Z"))).toBe("5");
    expect(label(new Date("2027-11-18T12:00:00Z"))).toBe("6");
  });
});
