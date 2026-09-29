import { calculateMatrix } from "@oracle/core";
import { ARCANA } from "@oracle/content";
import type { StoredChapter } from "@oracle/db";
import { existsSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { pdfArcanumImagePath, pdfAssetsDir, pdfFontPath, PDF_FONT_FILES } from "./pdf-assets";
import { buildReportPdf } from "./report-pdf";

const MATRIX = calculateMatrix({ year: 1988, month: 11, day: 18 });
const assetsDir = pdfAssetsDir();

const paragraph = (length: number) => `Аркан «Сила» — это тихая настойчивость. ${"мягкая договорённость ".repeat(length)}`.trim();
const prose = (id: StoredChapter["id"], paragraphs: number, length = 12): StoredChapter => ({ id, source: "ai", paragraphs: Array.from({ length: paragraphs }, () => paragraph(length)) });
const SCENARIO: StoredChapter = {
  id: "scenario",
  source: "ai",
  scenario: { pattern: "Повторяется привычка терпеть.", tension: "Между выдержкой и усталостью.", resource: "Спокойная уверенность.", blindSpot: "Собственная злость.", turningPoint: "Говорить раньше.", experiment: "Семь дней записывать чувство.", question: "Где я держу себя сильнее, чем нужно?" },
};
const pages = (pdf: Buffer) => pdf.toString("latin1").match(/\/Type \/Page\n/g)?.length ?? 0;

describe("buildReportPdf", () => {
  test("builds a PDF with a cover, contents, chapters and a scenario", async () => {
    const chapters = [...(["core", "task", "love", "money", "family", "purpose"] as const).map((id) => prose(id, 4)), SCENARIO];

    const pdf = await buildReportPdf({ matrix: MATRIX, birthDate: "1988-11-18", chapters, assetsDir });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pages(pdf)).toBeGreaterThanOrEqual(4);
  });

  test("continues long chapters on the next pages instead of cutting them", async () => {
    const short = await buildReportPdf({ matrix: MATRIX, birthDate: "1988-11-18", chapters: [prose("core", 3, 4)], assetsDir });
    const long = await buildReportPdf({ matrix: MATRIX, birthDate: "1988-11-18", chapters: [prose("core", 5, 60)], assetsDir });

    expect(pages(long)).toBeGreaterThan(pages(short));
  });

  test("skips chapters that are missing and accepts an empty report", async () => {
    const pdf = await buildReportPdf({ matrix: MATRIX, birthDate: "1988-11-18", chapters: [], assetsDir });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pages(pdf)).toBeGreaterThanOrEqual(3);
  });
});

describe("PDF assets", () => {
  test("every font and every cover illustration exists", () => {
    for (const font of Object.keys(PDF_FONT_FILES) as (keyof typeof PDF_FONT_FILES)[]) expect(existsSync(pdfFontPath(assetsDir, font))).toBe(true);
    for (const arcanum of ARCANA) expect(existsSync(pdfArcanumImagePath(assetsDir, arcanum)), arcanum.slug).toBe(true);
  });
});
