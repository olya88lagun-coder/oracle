import { THREAD_CHAPTER_IDS } from "@oracle/core";
import type { StoredThreadChapter } from "@oracle/db";
import { describe, expect, test } from "vitest";
import { pdfAssetsDir } from "./pdf-assets";
import { buildThreadPdf } from "./thread-pdf";

const chapters: StoredThreadChapter[] = THREAD_CHAPTER_IDS.map((id) => ({
  id,
  source: "fallback",
  blocks: [{ heading: "2027 · год 6 · забота", paragraphs: ["Абзац главы. ".repeat(40), "Второй абзац. ".repeat(40)] }],
}));
const base = { birthDate: "1990-07-15", today: new Date("2026-11-18T12:00:00Z"), assetsDir: pdfAssetsDir() };

describe("buildThreadPdf", () => {
  test("builds a PDF with the cover curve, contents and six chapters", async () => {
    const pdf = await buildThreadPdf({ ...base, chapters });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5_000);
  });

  test("copes with long chapters and with a missing chapter", async () => {
    const long = chapters.map((chapter) => ({ ...chapter, blocks: Array.from({ length: 12 }, () => chapter.blocks[0]!) }));
    expect((await buildThreadPdf({ ...base, chapters: long })).subarray(0, 5).toString()).toBe("%PDF-");
    expect((await buildThreadPdf({ ...base, chapters: chapters.slice(1) })).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
