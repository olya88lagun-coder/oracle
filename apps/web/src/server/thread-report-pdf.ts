import { calculateLifeThread, THREAD_CHAPTER_IDS, THREAD_CHAPTER_TITLES, type LifeThread } from "@oracle/core";
import type { StoredThreadChapter } from "@oracle/db";
import { curveLevels, labelEvery, smoothPath, threadWindow } from "@/lib/life-thread-curve";
import { THREAD_REPORT_TITLE } from "@/lib/thread-copy";
import { formatIsoDate } from "@/lib/report-offer";
import path from "node:path";
import { PDF_COLORS as COLORS, PDF_CONTENT_WIDTH as CONTENT_WIDTH, PDF_MARGIN as MARGIN, type PdfDoc as Doc } from "./pdf-common";
import { WHEEL_PALETTE as P } from "./pdf-natal-wheel";
import { buildTextReportPdf } from "./text-report-pdf";

const THREAD_LEAD = "Шесть глав о вашей нити. Это материал для размышления, а не предсказание.";
const THREAD_DEMO_LEAD = "Вымышленная дата. Шесть глав собраны из готовых описаний по рассчитанным периодам. Ваш разбор будет другим.";
const LEGEND = "Высота кривой — символический уровень этапа цикла личного года, а не оценка года. Золотая точка отмечает текущий год.";
const LEGEND_Y = 718;

// Кривая личных годов на тёмной панели, Catmull-Rom как на сайте. «Окно» — девять лет назад и вперёд с цифрами этапов, «всё» — вся жизнь
function drawCurve(doc: Doc, thread: LifeThread, mode: "window" | "all", top: number, height: number, caption: string) {
  const left = MARGIN.left;
  doc.rect(left, top, CONTENT_WIDTH, height).fill(P.panel);
  const years = threadWindow(thread.years, thread.currentYear, mode);
  if (years.length < 2) return;
  const detailed = mode === "window";
  const levels = curveLevels(years.map((item) => item.value));
  const x0 = left + 36;
  const x1 = left + CONTENT_WIDTH - 36;
  const plotTop = top + height * 0.21;
  const base = top + height * 0.71;
  const step = (x1 - x0) / (years.length - 1);
  const points = years.map((_, i) => ({ x: x0 + i * step, y: base - (levels[i] ?? 0) * (base - plotTop) }));
  const curve = smoothPath(points);
  const axis = base + 18;

  doc.moveTo(x0, axis).lineTo(x1, axis).lineWidth(0.6).stroke(P.line);
  const fade = doc.linearGradient(0, plotTop, 0, axis);
  fade.stop(0, P.gold, 0.35).stop(1, P.gold, 0);
  doc.path(`${curve} L${points.at(-1)!.x.toFixed(1)},${axis} L${x0},${axis} Z`).fill(fade);
  doc.path(curve).lineWidth(detailed ? 2 : 1.5).lineCap("round").stroke(P.gold);

  const every = labelEvery(mode, false, step);
  const nowIndex = Math.max(0, years.findIndex((item) => item.year === thread.currentYear));
  for (const [i, item] of years.entries()) {
    const point = points[i]!;
    const isNow = i === nowIndex;
    if (isNow) {
      doc.moveTo(point.x, point.y).lineTo(point.x, axis).dash(2, { space: 3 }).lineWidth(0.8).stroke(P.gold).undash();
      doc.circle(point.x, point.y, detailed ? 5.5 : 4).fill(P.gold);
      doc.circle(point.x, point.y, detailed ? 9 : 7).lineWidth(0.8).stroke(P.gold);
    } else if (detailed) {
      doc.circle(point.x, point.y, 2.2).fill(P.ink);
    }
    if (isNow || (item.year % every === 0 && Math.abs(i - nowIndex) * step > 30)) {
      doc.font("bodyBold").fontSize(8.5).fillColor(isNow ? P.gold : P.soft).text(String(item.year), point.x - 20, base + 40 * (height / 330 + 0.1), { width: 40, align: "center", lineBreak: false });
    }
    if (detailed) doc.font("body").fontSize(8).fillColor(P.soft).text(String(item.value), point.x - 10, point.y - 20, { width: 20, align: "center", lineBreak: false });
  }
  doc.font("bodyBold").fontSize(9).fillColor(P.gold).text(caption, x0, top + 20, { width: x1 - x0, lineBreak: false });
}

function drawThreadPage(doc: Doc, thread: LifeThread, birthDate: string) {
  doc.font("display").fontSize(26).fillColor(COLORS.ink).text("Ваша нить", MARGIN.left, MARGIN.top);
  doc.font("body").fontSize(10.5).fillColor(COLORS.muted).text(`Личные годы по дате ${formatIsoDate(birthDate)}`, MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH });
  drawCurve(doc, thread, "window", 128, 320, `Вы здесь · ${thread.currentYear}`);
  drawCurve(doc, thread, "all", 468, 200, "Вся жизнь");
  doc.font("body").fontSize(9.5).fillColor(COLORS.muted).text(LEGEND, MARGIN.left, LEGEND_Y, { width: CONTENT_WIDTH, lineGap: 2.5 });
}

export type ThreadPdfInput = { chapters: readonly StoredThreadChapter[]; birthDate: string; today: Date; assetsDir: string; demo?: boolean };

export function buildThreadReportPdf({ chapters, birthDate, today, assetsDir, demo }: ThreadPdfInput): Promise<Buffer> {
  const thread = calculateLifeThread(birthDate, today);
  const ordered = THREAD_CHAPTER_IDS.flatMap((id) => chapters.filter((chapter) => chapter.id === id));
  return buildTextReportPdf({
    title: THREAD_REPORT_TITLE,
    eyebrow: `${demo ? "Демонстрационный пример" : THREAD_REPORT_TITLE} · по дате ${formatIsoDate(birthDate)}`,
    lead: demo ? THREAD_DEMO_LEAD : THREAD_LEAD,
    chapters: ordered.map((chapter) => ({ title: THREAD_CHAPTER_TITLES[chapter.id], blocks: chapter.blocks })),
    assetsDir,
    coverImage: path.join(/*turbopackIgnore: true*/ assetsDir, "thread", "hero.jpg"),
    intro: thread ? (doc) => drawThreadPage(doc, thread, birthDate) : undefined,
  });
}
