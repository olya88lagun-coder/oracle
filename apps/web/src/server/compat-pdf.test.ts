import { calculateCompatibility } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { buildCompatPdf } from "./compat-pdf";
import { pdfAssetsDir } from "./pdf-assets";

describe("buildCompatPdf", () => {
  test("builds a PDF from the finished calculation", async () => {
    const compat = calculateCompatibility({ year: 1988, month: 11, day: 18 }, { year: 2000, month: 1, day: 1 });
    const pdf = await buildCompatPdf({ compat, madeAt: new Date("2026-10-05T10:00:00Z"), assetsDir: pdfAssetsDir() });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5_000);
  });

  test("works for every pair arcanum, including the same date twice", async () => {
    const same = calculateCompatibility({ year: 1988, month: 11, day: 18 }, { year: 1988, month: 11, day: 18 });
    expect((await buildCompatPdf({ compat: same, madeAt: new Date(), assetsDir: pdfAssetsDir() })).length).toBeGreaterThan(5_000);
    for (let pair = 1; pair <= 22; pair += 1) {
      const base = calculateCompatibility({ year: 1988, month: 11, day: 18 }, { year: 1988, month: 11, day: 18 });
      const compat = { ...base, pair };
      expect((await buildCompatPdf({ compat, madeAt: new Date(), assetsDir: pdfAssetsDir() })).subarray(0, 5).toString()).toBe("%PDF-");
    }
  });
});
