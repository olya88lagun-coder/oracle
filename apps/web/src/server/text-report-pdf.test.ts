import { describe, expect, test } from "vitest";
import { pdfAssetsDir } from "./pdf-assets";
import { buildTextReportPdf, type TextReportChapter } from "./text-report-pdf";

const assetsDir = pdfAssetsDir();
const pages = (pdf: Buffer) => pdf.toString("latin1").match(/\/Type \/Page\n/g)?.length ?? 0;
const base = { title: "Разбор нити", eyebrow: "Разбор нити · по дате 07.03.1990", lead: "Шесть глав.", assetsDir };
const chapter = (paragraphs: number): TextReportChapter => ({ title: "Где вы сейчас", blocks: [{ heading: "Год", paragraphs: Array.from({ length: paragraphs }, () => "Спокойный период. ".repeat(60)) }] });

describe("buildTextReportPdf", () => {
  test("builds a PDF with a cover, contents and a scenario chapter", async () => {
    const scenario = { pattern: "а", tension: "б", resource: "в", blindSpot: "г", turningPoint: "д", experiment: "е", question: "ж?" };
    const pdf = await buildTextReportPdf({ ...base, chapters: [chapter(2), { title: "Ваш сценарий", scenario }] });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pages(pdf)).toBeGreaterThanOrEqual(3);
  });

  test("continues long chapters on the next pages and accepts an empty report", async () => {
    const short = await buildTextReportPdf({ ...base, chapters: [chapter(1)] });
    const long = await buildTextReportPdf({ ...base, chapters: [chapter(12)] });
    expect(pages(long)).toBeGreaterThan(pages(short));
    expect((await buildTextReportPdf({ ...base, chapters: [] })).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
