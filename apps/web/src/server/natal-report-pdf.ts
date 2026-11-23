import { NATAL_CHAPTER_IDS, NATAL_CHAPTER_TITLES, natalChapterOutline, type NatalChapterOutline } from "@oracle/core/natal-report";
import { natalPageSlug } from "@oracle/content/natal";
import type { StoredNatalChapter } from "@oracle/db";
import type { NatalReportChart } from "@/components/report/NatalReportView";
import { formatBirthMeta, REPORT_PAGE_LEAD, REPORT_PAGE_TITLE } from "@/lib/natal-copy";
import { pointLabel } from "@/lib/natal-report-offer";
import { formatIsoDate } from "@/lib/report-offer";
import { existsSync } from "node:fs";
import path from "node:path";
import { drawNatalWheel, WHEEL_PALETTE } from "./pdf-natal-wheel";
import { PDF_COLORS as COLORS, PDF_CONTENT_WIDTH as CONTENT_WIDTH, PDF_MARGIN as MARGIN, PDF_PAGE as PAGE, type PdfDoc as Doc } from "./pdf-common";
import { buildTextReportPdf, drawFramedImage, type GalleryImage, type TextReportChapter } from "./text-report-pdf";

const COVER_GRAVURE = 118;
const COVER_GRAVURE_GAP = 22;
const PANEL_TOP = 128;
const LEGEND = "Знаки зодиака идут по внешнему кольцу, цифры внутри — дома. Зелёные хорды — трины, лавандовые — квадраты и оппозиции, пунктир — секстили.";

const natalImage = (assetsDir: string, name: string): string => path.join(/*turbopackIgnore: true*/ assetsDir, "natal", `${name}.jpg`);

// Гравюры точек главы; нет файла (новая страница без картинки) — точка пропускается
function galleryOf(assetsDir: string, outline: NatalChapterOutline | undefined): GalleryImage[] {
  return (outline?.points ?? []).flatMap((point) => {
    const file = natalImage(assetsDir, natalPageSlug(point.body, point.sign));
    return existsSync(file) ? [{ path: file, caption: pointLabel(point) }] : [];
  });
}

function outlinesOf(chart: NatalReportChart["chart"] | undefined): Map<string, NatalChapterOutline> {
  if (!chart?.timeKnown) return new Map();
  try {
    return new Map(natalChapterOutline(chart).map((outline) => [outline.id, outline]));
  } catch {
    return new Map();
  }
}

// Три главные гравюры карты (Солнце, Луна, асцендент) на обложке
function drawBigThree(doc: Doc, assetsDir: string, outline: NatalChapterOutline | undefined) {
  const items = (outline?.points ?? []).flatMap((point) => {
    const file = natalImage(assetsDir, natalPageSlug(point.body, point.sign));
    return existsSync(file) ? [{ file, caption: pointLabel(point) }] : [];
  });
  if (items.length === 0) return;
  const total = items.length * COVER_GRAVURE + (items.length - 1) * COVER_GRAVURE_GAP;
  const left = (PAGE.width - total) / 2;
  const top = 566;
  for (const [index, item] of items.entries()) {
    const x = left + index * (COVER_GRAVURE + COVER_GRAVURE_GAP);
    drawFramedImage(doc, item.file, x, top, COVER_GRAVURE);
    doc.font("bodyBold").fontSize(9).fillColor(COLORS.coverInk).text(item.caption, x - 6, top + COVER_GRAVURE + 10, { width: COVER_GRAVURE + 12, align: "center", lineGap: 1 });
  }
}

// Страница с колесом: тёмная панель, подпись о рождении и пояснение к цветам
function drawWheelPage(doc: Doc, chartData: NatalReportChart) {
  doc.font("display").fontSize(26).fillColor(COLORS.ink).text("Ваша карта", MARGIN.left, MARGIN.top);
  doc.font("body").fontSize(10.5).fillColor(COLORS.muted).text(formatBirthMeta(chartData.birth), MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH });
  doc.rect(MARGIN.left, PANEL_TOP, CONTENT_WIDTH, CONTENT_WIDTH).fill(WHEEL_PALETTE.panel);
  const padding = 14;
  drawNatalWheel(doc, chartData.chart, MARGIN.left + padding, PANEL_TOP + padding, CONTENT_WIDTH - 2 * padding);
  doc.font("body").fontSize(9.5).fillColor(COLORS.muted).text(LEGEND, MARGIN.left, PANEL_TOP + CONTENT_WIDTH + 16, { width: CONTENT_WIDTH, lineGap: 2.5 });
}

export type NatalPdfInput = { chapters: readonly StoredNatalChapter[]; date: string; placeName: string | null; chartData: NatalReportChart | null; assetsDir: string };

export function buildNatalReportPdf({ chapters, date, placeName, chartData, assetsDir }: NatalPdfInput): Promise<Buffer> {
  const outlines = outlinesOf(chartData?.chart);
  const ordered = NATAL_CHAPTER_IDS.flatMap((id) => chapters.filter((chapter) => chapter.id === id));
  const content: TextReportChapter[] = ordered.map((chapter) => {
    const outline = outlines.get(chapter.id);
    return {
      title: NATAL_CHAPTER_TITLES[chapter.id],
      gallery: galleryOf(assetsDir, outline),
      banner: chapter.id === "scenario" ? natalImage(assetsDir, "scenario") : undefined,
      blocks: [{ paragraphs: chapter.paragraphs ?? [] }],
      scenario: chapter.scenario,
    };
  });
  return buildTextReportPdf({
    title: REPORT_PAGE_TITLE,
    eyebrow: `${REPORT_PAGE_TITLE} · по дате ${formatIsoDate(date)}${placeName ? `, ${placeName}` : ""}`,
    lead: REPORT_PAGE_LEAD,
    chapters: content,
    assetsDir,
    coverImage: natalImage(assetsDir, "hero"),
    coverExtra: chartData ? (doc) => drawBigThree(doc, assetsDir, outlines.get("core")) : undefined,
    intro: chartData ? (doc) => drawWheelPage(doc, chartData) : undefined,
  });
}
