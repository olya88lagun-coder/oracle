import { calculateLifeThread, THREAD_CHAPTER_IDS, THREAD_CHAPTER_TITLES, type LifeThread } from "@oracle/core";
import type { StoredThreadChapter } from "@oracle/db";
import { DISCLAIMER } from "@/lib/legal";
import { curveLevels, labelEvery, smoothPath } from "@/lib/life-thread-curve";
import { formatIsoDate } from "@/lib/report-offer";
import {
  createPdfDoc,
  drawFooters,
  ensureSpace,
  newPage,
  paintPagesLight,
  PDF_COLORS as COLORS,
  PDF_CONTENT_WIDTH as CONTENT_WIDTH,
  PDF_MARGIN as MARGIN,
  PDF_PAGE as PAGE,
  registerPdfFonts,
  type PdfDoc,
} from "./pdf-common";

export type ThreadPdfInput = {
  birthDate: string;
  chapters: readonly StoredThreadChapter[];
  // «Сегодня» разбора: дата его создания, у примера — замороженная дата
  today: Date;
  assetsDir: string;
  demo?: boolean;
};

const COVER_SIDE = 70;
const CURVE_HEIGHT = 170;
const BANNER_HEIGHT = 120;

function drawOrnament(doc: PdfDoc, centerX: number, y: number, color: string) {
  doc.save();
  doc.lineWidth(0.6).strokeColor(color);
  doc.moveTo(centerX - 64, y).lineTo(centerX - 9, y).stroke();
  doc.moveTo(centerX + 9, y).lineTo(centerX + 64, y).stroke();
  doc.translate(centerX, y).rotate(45).rect(-3, -3, 6, 6).fill(color);
  doc.restore();
}

// Нить на всю жизнь: та же сглаженная кривая, что на сайте; золотая точка — нынешний год
function drawCurve(doc: PdfDoc, thread: LifeThread, x: number, y: number, width: number, height: number) {
  const years = thread.years;
  if (years.length < 2) return;
  const levels = curveLevels(years.map((item) => item.value));
  const step = width / (years.length - 1);
  const points = levels.map((level, index) => ({ x: index * step, y: (1 - level) * height }));
  doc.save();
  doc.translate(x, y);
  doc.lineWidth(0.4).strokeColor(COLORS.gold).opacity(0.35).moveTo(0, height + 14).lineTo(width, height + 14).stroke().opacity(1);
  doc.lineWidth(2.4).lineCap("round").strokeColor(COLORS.gold).opacity(0.22).path(smoothPath(points)).stroke().opacity(1);
  doc.lineWidth(1.2).strokeColor(COLORS.gold).path(smoothPath(points)).stroke();
  const every = labelEvery("all", false, step);
  doc.font("body").fontSize(7.5).fillColor(COLORS.coverSoft);
  years.forEach((item, index) => {
    if (item.year % every !== 0) return;
    doc.text(String(item.year), index * step - 14, height + 20, { width: 28, align: "center", lineBreak: false });
  });
  const nowIndex = years.findIndex((item) => item.year === thread.currentYear);
  const now = points[nowIndex];
  if (now) {
    doc.circle(now.x, now.y, 9).fillOpacity(0.18).fill(COLORS.gold).fillOpacity(1);
    doc.circle(now.x, now.y, 3.6).fill(COLORS.coverInk);
    doc.circle(now.x, now.y, 3.6).lineWidth(1).stroke(COLORS.gold);
  }
  doc.restore();
}

function drawCover(doc: PdfDoc, input: ThreadPdfInput, thread: LifeThread | null) {
  const width = PAGE.width - 2 * COVER_SIDE;
  const centerX = PAGE.width / 2;
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.coverBg);
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.gold);
  doc.text(`${input.demo ? "ДЕМОНСТРАЦИОННЫЙ ПРИМЕР" : "РАЗБОР НИТИ"} · ПО ДАТЕ ${formatIsoDate(input.birthDate)}`, COVER_SIDE, 150, { width, align: "center", characterSpacing: 1.6 });
  doc.font("display").fontSize(44).fillColor(COLORS.coverInk).text("Ваша нить", COVER_SIDE, doc.y + 18, { width, align: "center" });
  drawOrnament(doc, centerX, doc.y + 22, COLORS.gold);
  if (thread) drawCurve(doc, thread, COVER_SIDE, doc.y + 80, width, CURVE_HEIGHT);
  doc.font("body").fontSize(12).fillColor(COLORS.coverSoft);
  doc.text(input.demo ? "Вымышленная дата. Шесть глав собраны из готовых описаний по рассчитанным периодам. Ваш разбор будет другим." : "Шесть глав о том, как складываются ваши годы, месяцы и периоды. Это материал для размышления, а не предсказание.", COVER_SIDE, 590, { width, align: "center", lineGap: 4 });
  // Без нулевого нижнего поля подпись у края страницы уходит на новую страницу
  doc.page.margins.bottom = 0;
  doc.font("bodyBold").fontSize(9).fillColor(COLORS.gold);
  doc.text("tvoy-orakul.ru", COVER_SIDE, PAGE.height - 58, { width, align: "center", characterSpacing: 1.2 });
}

function drawContents(doc: PdfDoc, chapters: readonly StoredThreadChapter[]) {
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.accent).text("СОДЕРЖАНИЕ", MARGIN.left, MARGIN.top, { width: CONTENT_WIDTH, characterSpacing: 1.6 });
  doc.font("display").fontSize(30).fillColor(COLORS.ink).text("Оглавление", MARGIN.left, doc.y + 6);
  let y = doc.y + 26;
  chapters.forEach((chapter, index) => {
    doc.moveTo(MARGIN.left, y - 10).lineTo(PAGE.width - MARGIN.right, y - 10).lineWidth(0.5).stroke(COLORS.line);
    doc.font("display").fontSize(24).fillColor(COLORS.accent).text(String(index + 1), MARGIN.left, y - 4, { width: 34, lineBreak: false });
    doc.font("display").fontSize(17).fillColor(COLORS.ink).text(THREAD_CHAPTER_TITLES[chapter.id], MARGIN.left + 46, y, { width: CONTENT_WIDTH - 46 });
    y = doc.y + 24;
  });
  doc.y = y;
}

function drawChapters(doc: PdfDoc, chapters: readonly StoredThreadChapter[]) {
  chapters.forEach((chapter, index) => {
    newPage(doc);
    doc.rect(0, 0, PAGE.width, BANNER_HEIGHT).fill(COLORS.coverBg);
    doc.rect(0, BANNER_HEIGHT, PAGE.width, 2.5).fill(COLORS.gold);
    doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.gold).text(`ГЛАВА ${index + 1}`, MARGIN.left, BANNER_HEIGHT - 70, { width: CONTENT_WIDTH, characterSpacing: 1.8, lineBreak: false });
    doc.font("display").fontSize(30).fillColor(COLORS.coverInk).text(THREAD_CHAPTER_TITLES[chapter.id], MARGIN.left, BANNER_HEIGHT - 54, { width: CONTENT_WIDTH, lineBreak: false });
    doc.y = BANNER_HEIGHT + 32;
    for (const block of chapter.blocks) {
      if (block.heading) {
        ensureSpace(doc, 90);
        doc.font("display").fontSize(17).fillColor(COLORS.accent).text(block.heading, MARGIN.left, doc.y, { width: CONTENT_WIDTH });
        doc.moveDown(0.5);
      }
      for (const paragraph of block.paragraphs) {
        ensureSpace(doc, 60);
        doc.font("body").fontSize(11).fillColor(COLORS.ink).text(paragraph, MARGIN.left, doc.y, { width: CONTENT_WIDTH, lineGap: 4, paragraphGap: 10 });
      }
      doc.y += 10;
    }
  });
}

export function buildThreadPdf(input: ThreadPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = createPdfDoc({ Title: "Разбор нити", Subject: `Разбор нити по дате ${formatIsoDate(input.birthDate)}` });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      registerPdfFonts(doc, input.assetsDir);
      const byId = new Map(input.chapters.map((chapter) => [chapter.id, chapter]));
      const ordered = THREAD_CHAPTER_IDS.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
      drawCover(doc, input, calculateLifeThread(input.birthDate, input.today));
      paintPagesLight(doc);
      newPage(doc);
      drawContents(doc, ordered);
      drawChapters(doc, ordered);

      ensureSpace(doc, 80);
      doc.moveTo(MARGIN.left, doc.y + 6).lineTo(PAGE.width - MARGIN.right, doc.y + 6).lineWidth(0.5).stroke(COLORS.line);
      doc.font("body").fontSize(9).fillColor(COLORS.muted).text(DISCLAIMER, MARGIN.left, doc.y + 16, { width: CONTENT_WIDTH, lineGap: 2 });

      drawFooters(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
