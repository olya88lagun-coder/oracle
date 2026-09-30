import { describe, expect, test } from "vitest";
import { buildLilaPdf } from "./lila-pdf";
import { pdfAssetsDir } from "./pdf-assets";

const chapters = (["path", "repeats", "noticed", "outcome"] as const).map((id) => ({
  id,
  source: "fallback" as const,
  paragraphs: ["Абзац итога. ".repeat(30), "Второй абзац. ".repeat(30)],
}));

describe("buildLilaPdf", () => {
  test("builds a PDF with the intention, four chapters and the moves", async () => {
    const pdf = await buildLilaPdf({
      intention: "Почему мне трудно принять решение о работе?",
      movesCount: 12,
      finishedAt: new Date("2026-10-05T10:00:00Z"),
      chapters,
      moves: [
        { n: 1, cell: "Рождение", note: null },
        { n: 2, cell: "Алчность", note: "Заметила сравнение." },
      ],
      assetsDir: pdfAssetsDir(),
    });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5_000);
  });

  test("copes with a long game of 120 moves with notes", async () => {
    const moves = Array.from({ length: 120 }, (_, i) => ({ n: i + 1, cell: "Клетка", note: i % 3 === 0 ? "Запись мысли. ".repeat(10) : null }));
    const pdf = await buildLilaPdf({ intention: "Я".repeat(300), movesCount: 120, finishedAt: new Date("2026-10-05T10:00:00Z"), chapters, moves, assetsDir: pdfAssetsDir() });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
