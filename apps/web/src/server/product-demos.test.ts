import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { CHAPTER_IDS, LILA_CONCLUSION_CHAPTERS, replayLila } from "@oracle/core";
import { DEMO_CONCLUSION, DEMO_INTENTION, DEMO_MATRIX, DEMO_MOVES, DEMO_REPORT } from "./product-demos";
import { buildReportPdf } from "./report-pdf";
import { buildLilaPdf } from "./lila-pdf";
import { pdfAssetsDir } from "./pdf-assets";
import { lilaCellByNumber } from "@oracle/content/lila";

describe("public product examples", () => {
  test("the matrix example uses all seven chapters with the calculated points", () => {
    expect(DEMO_MATRIX).toMatchObject({ A: 15, E: 7, D: 8 });
    expect(DEMO_REPORT.map((chapter) => chapter.id)).toEqual(CHAPTER_IDS);
    expect(DEMO_REPORT.every((chapter) => chapter.source === "fallback")).toBe(true);
    expect(DEMO_REPORT[6]?.scenario?.experiment).toContain("Семь дней");
  });
  test("the Lila example uses a legal ten-turn path and four chapters", () => {
    const replay = replayLila(DEMO_MOVES.map((move) => move.roll));
    expect(replay.results.map((move) => move.to)).toEqual(DEMO_MOVES.map((move) => move.to));
    expect(DEMO_MOVES).toHaveLength(10);
    expect(DEMO_CONCLUSION.map((chapter) => chapter.id)).toEqual(LILA_CONCLUSION_CHAPTERS);
    expect(DEMO_CONCLUSION[0]?.paragraphs.join(" ")).toContain(DEMO_INTENTION);
  });
  test("the normal PDF builders accept both complete examples", async () => {
    const assetsDir = pdfAssetsDir();
    const report = await buildReportPdf({ matrix: DEMO_MATRIX, birthDate: "1990-01-15", chapters: DEMO_REPORT, assetsDir, demo: true });
    const lila = await buildLilaPdf({ intention: DEMO_INTENTION, movesCount: DEMO_MOVES.length, finishedAt: new Date("2026-10-11T10:00:00Z"), chapters: DEMO_CONCLUSION, moves: DEMO_MOVES.map((move) => ({ n: move.n, cell: lilaCellByNumber(move.to).name, note: move.note })), assetsDir, demo: true });
    expect(report.subarray(0, 5).toString()).toBe("%PDF-");
    expect(lila.subarray(0, 5).toString()).toBe("%PDF-");
    // Явный локальный экспорт после правок контента; обычный запуск не изменяет файлы.
    if (process.env.EXPORT_PRODUCT_DEMOS === "1") {
      mkdirSync("apps/web/public/examples", { recursive: true });
      writeFileSync("apps/web/public/examples/matrix.pdf", report);
      writeFileSync("apps/web/public/examples/lila.pdf", lila);
    }
    for (const file of ["matrix", "lila"]) {
      const path = `apps/web/public/examples/${file}.pdf`;
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path).subarray(0, 5).toString()).toBe("%PDF-");
    }
  });
});
