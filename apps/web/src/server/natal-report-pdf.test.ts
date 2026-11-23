import { natalPageSlug, NATAL_PAGES } from "@oracle/content/natal";
import { calculateLifeThread } from "@oracle/core";
import { buildThreadReport } from "@oracle/content/thread-report";
import { numerologyText } from "@oracle/content/numerology";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { DEMO_THREAD_BIRTH, DEMO_TODAY } from "@/lib/thread-demo";
import { GLYPHS } from "./natal-glyph-data";
import { buildNatalReportPdf } from "./natal-report-pdf";
import { pdfAssetsDir } from "./pdf-assets";
import { DEMO_NATAL_CHART_DATA, DEMO_NATAL_DATE, DEMO_NATAL_PLACE, DEMO_NATAL_REPORT } from "./product-demos";
import { buildThreadReportPdf } from "./thread-report-pdf";

const assetsDir = pdfAssetsDir();
const images = (pdf: Buffer) => pdf.toString("latin1").match(/\/Subtype \/Image/g)?.length ?? 0;

describe("natal report PDF", () => {
  test("has the wheel page and gravures on the cover and in the chapters", async () => {
    const pdf = await buildNatalReportPdf({ chapters: DEMO_NATAL_REPORT, date: DEMO_NATAL_DATE, placeName: DEMO_NATAL_PLACE, chartData: DEMO_NATAL_CHART_DATA, assetsDir });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    // Обложка (картинка + три гравюры), по гравюре на каждую точку глав и вставка сценария
    expect(images(pdf)).toBeGreaterThanOrEqual(8);
  });

  test("still builds without the chart (birth data erased)", async () => {
    const pdf = await buildNatalReportPdf({ chapters: DEMO_NATAL_REPORT, date: DEMO_NATAL_DATE, placeName: null, chartData: null, assetsDir });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  test("every sign gravure used in the PDF exists", () => {
    for (const page of NATAL_PAGES.filter((item) => item.kind !== "node")) expect(existsSync(path.join(assetsDir, "natal", `${natalPageSlug(page.body, page.sign)}.jpg`)), page.slug).toBe(true);
    for (const name of ["hero", "scenario"]) expect(existsSync(path.join(assetsDir, "natal", `${name}.jpg`)), name).toBe(true);
  });

  test("glyph data covers every glyph of the sprite", () => {
    const sprite = readFileSync(path.join(__dirname, "../components/natal/NatalSprite.tsx"), "utf8");
    const ids = [...sprite.matchAll(/<symbol id="(glyph-[a-z]+)"/g)].map((match) => match[1]);
    expect(Object.keys(GLYPHS).sort()).toEqual([...ids].sort());
  });
});

describe("thread report PDF", () => {
  test("builds the cover, the thread page and the chapters", async () => {
    const thread = calculateLifeThread(DEMO_THREAD_BIRTH, DEMO_TODAY)!;
    const chapters = buildThreadReport(thread, numerologyText);
    const pdf = await buildThreadReportPdf({ chapters, birthDate: DEMO_THREAD_BIRTH, today: DEMO_TODAY, assetsDir });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(images(pdf)).toBe(1);
  });
});
