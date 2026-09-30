import { LILA_CONCLUSION_TITLES } from "@oracle/core";
import type { StoredConclusionChapter } from "@oracle/db";
import { DISCLAIMER } from "@/lib/legal";
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

export type LilaPdfInput = {
  intention: string;
  movesCount: number;
  finishedAt: Date;
  chapters: readonly StoredConclusionChapter[];
  moves: readonly { n: number; cell: string; note: string | null }[];
  assetsDir: string;
};

const COVER_SIDE = 80;
const dateLabel = (date: Date): string => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Moscow" }).format(date);

function drawCover(doc: PdfDoc, input: LilaPdfInput) {
  const width = PAGE.width - 2 * COVER_SIDE;
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.coverBg);
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.gold);
  doc.text(`ПАРТИЯ ЛИЛЫ · ${dateLabel(input.finishedAt)}`, COVER_SIDE, 250, { width, align: "center", characterSpacing: 1.6 });
  doc.font("display").fontSize(30).fillColor(COLORS.coverInk);
  doc.text(input.intention, COVER_SIDE, doc.y + 22, { width, align: "center", lineGap: 5 });
  doc.font("body").fontSize(12).fillColor(COLORS.coverSoft);
  doc.text(`Ходов: ${input.movesCount}. Это материал для размышления, а не предсказание.`, COVER_SIDE, doc.y + 22, { width, align: "center", lineGap: 4 });
  // Без нулевого нижнего поля подпись у края страницы уходит на новую страницу
  doc.page.margins.bottom = 0;
  doc.font("bodyBold").fontSize(9).fillColor(COLORS.gold);
  doc.text("tvoy-orakul.ru", COVER_SIDE, PAGE.height - 72, { width, align: "center", characterSpacing: 1.2 });
}

function drawChapters(doc: PdfDoc, chapters: readonly StoredConclusionChapter[]) {
  for (const chapter of chapters) {
    ensureSpace(doc, 190);
    doc.font("display").fontSize(22).fillColor(COLORS.ink).text(LILA_CONCLUSION_TITLES[chapter.id], MARGIN.left, doc.y, { width: CONTENT_WIDTH });
    doc.moveDown(0.6);
    for (const paragraph of chapter.paragraphs) {
      doc.font("body").fontSize(11).fillColor(COLORS.ink).text(paragraph, MARGIN.left, doc.y, { width: CONTENT_WIDTH, lineGap: 3.5, paragraphGap: 9 });
    }
    doc.y += 22;
  }
}

function drawMoves(doc: PdfDoc, moves: LilaPdfInput["moves"]) {
  ensureSpace(doc, 120);
  doc.font("display").fontSize(22).fillColor(COLORS.ink).text("Ходы", MARGIN.left, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.6);
  for (const move of moves) {
    ensureSpace(doc, 46);
    doc.font("bodyBold").fontSize(10.5).fillColor(COLORS.accent).text(`Ход ${move.n} · клетка «${move.cell}»`, MARGIN.left, doc.y, { width: CONTENT_WIDTH });
    if (move.note) doc.font("body").fontSize(10.5).fillColor(COLORS.muted).text(move.note, MARGIN.left, doc.y + 2, { width: CONTENT_WIDTH, lineGap: 2.5 });
    doc.y += 8;
  }
}

export function buildLilaPdf(input: LilaPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = createPdfDoc({ Title: "Партия Лилы", Subject: `Итог партии от ${dateLabel(input.finishedAt)}` });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      registerPdfFonts(doc, input.assetsDir);
      drawCover(doc, input);
      paintPagesLight(doc);
      newPage(doc);
      drawChapters(doc, input.chapters);
      drawMoves(doc, input.moves);

      ensureSpace(doc, 80);
      doc.moveTo(MARGIN.left, doc.y).lineTo(PAGE.width - MARGIN.right, doc.y).lineWidth(0.5).stroke(COLORS.line);
      doc.font("body").fontSize(9).fillColor(COLORS.muted).text(DISCLAIMER, MARGIN.left, doc.y + 10, { width: CONTENT_WIDTH, lineGap: 2 });

      drawFooters(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
