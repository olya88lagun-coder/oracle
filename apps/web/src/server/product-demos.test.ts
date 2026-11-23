import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { calculateLifeThread, CHAPTER_IDS, LILA_CONCLUSION_CHAPTERS, replayLila } from "@oracle/core";
import { DEMO_CONCLUSION, DEMO_INTENTION, DEMO_MATRIX, DEMO_MOVES, DEMO_REPORT } from "./product-demos";
import { numerologyText } from "@oracle/content/numerology";
import { buildThreadReport } from "@oracle/content/thread-report";
import { DEMO_THREAD_BIRTH, DEMO_TODAY } from "@/lib/thread-demo";
import { buildReportPdf } from "./report-pdf";
import { buildThreadPdf } from "./thread-pdf";
import { buildLilaPdf } from "./lila-pdf";
import { pdfAssetsDir } from "./pdf-assets";

// От папки теста, а не от рабочей папки: тест одинаково работает из корня репозитория и из apps/web
const EXAMPLES = fileURLToPath(new URL("../../public/examples/", import.meta.url));

describe("public product examples", () => {
  test("the matrix example uses all seven chapters with the calculated points", () => {
    expect(DEMO_MATRIX).toMatchObject({ A: 15, E: 7, D: 8 });
    expect(DEMO_REPORT.map((chapter) => chapter.id)).toEqual(CHAPTER_IDS);
    expect(DEMO_REPORT.every((chapter) => chapter.source === "ai")).toBe(true);
    expect(Object.keys(DEMO_REPORT[6]?.scenario ?? {})).toHaveLength(7);
  });
  test("the Lila example uses a legal ten-turn path and four chapters", () => {
    const replay = replayLila(DEMO_MOVES.map((move) => move.roll));
    expect(replay.results.map((move) => move.to)).toEqual(DEMO_MOVES.map((move) => move.to));
    expect(DEMO_MOVES).toHaveLength(10);
    expect(DEMO_CONCLUSION.map((chapter) => chapter.id)).toEqual(LILA_CONCLUSION_CHAPTERS);
    expect(DEMO_CONCLUSION[0]?.paragraphs.join(" ")).toContain(DEMO_INTENTION.replace(/^К/, "к").replace(/\?$/, ""));
    expect(DEMO_CONCLUSION.every((chapter) => chapter.source === "ai")).toBe(true);
  });
  test("the normal PDF builders accept both complete examples", async () => {
    const assetsDir = pdfAssetsDir();
    const report = await buildReportPdf({ matrix: DEMO_MATRIX, birthDate: "1990-01-15", chapters: DEMO_REPORT, assetsDir, demo: true });
    const lila = await buildLilaPdf({ intention: DEMO_INTENTION, movesCount: DEMO_MOVES.length, finishedAt: new Date("2026-11-23T10:00:00Z"), chapters: DEMO_CONCLUSION, moves: DEMO_MOVES, assetsDir, demo: true });
    const thread = await buildThreadPdf({ birthDate: DEMO_THREAD_BIRTH, chapters: buildThreadReport(calculateLifeThread(DEMO_THREAD_BIRTH, DEMO_TODAY)!, numerologyText), today: DEMO_TODAY, assetsDir, demo: true });
    expect(report.subarray(0, 5).toString()).toBe("%PDF-");
    expect(thread.subarray(0, 5).toString()).toBe("%PDF-");
    expect(lila.subarray(0, 5).toString()).toBe("%PDF-");
    // Явный локальный экспорт после правок контента; обычный запуск не изменяет файлы.
    if (process.env.EXPORT_PRODUCT_DEMOS === "1") {
      mkdirSync(EXAMPLES, { recursive: true });
      writeFileSync(`${EXAMPLES}matrix.pdf`, report);
      writeFileSync(`${EXAMPLES}lila.pdf`, lila);
      writeFileSync(`${EXAMPLES}thread.pdf`, thread);
    }
    for (const file of ["matrix", "lila", "thread"]) {
      const path = `${EXAMPLES}${file}.pdf`;
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path).subarray(0, 5).toString()).toBe("%PDF-");
    }
  });
});
