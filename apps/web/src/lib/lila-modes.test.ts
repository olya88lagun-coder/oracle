import { LILA_CONCLUSION_CHAPTERS, LILA_CONCLUSION_TITLES } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { LILA_MODE_ROWS } from "./lila-modes";

describe("lila modes table", () => {
  test("the guided cell of the conclusion names every real chapter", () => {
    const row = LILA_MODE_ROWS.find((r) => r.what === "Итог партии")!;
    for (const id of LILA_CONCLUSION_CHAPTERS) expect(row.guided).toContain(LILA_CONCLUSION_TITLES[id]);
  });

  test("the free mode never claims the conclusion, the PDF or the guide", () => {
    for (const what of ["Итог партии", "PDF с итогом", "Абзацы проводника по ходам"]) expect(LILA_MODE_ROWS.find((r) => r.what === what)?.free).toBe("Нет");
  });

  test("no price and no prediction wording in the table", () => {
    for (const row of LILA_MODE_ROWS) expect(`${row.what} ${row.free} ${row.guided}`).not.toMatch(/₽|предскаж|прогноз/i);
  });
});
