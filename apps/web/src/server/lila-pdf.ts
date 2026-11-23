import { lilaFacts, lilaVisitCounts, LILA_CONCLUSION_TITLES, type FactsMove, type LilaConclusionChapterId } from "@oracle/core";
import { lilaCellByNumber } from "@oracle/content/lila";
import type { StoredConclusionChapter } from "@oracle/db";
import { DISCLAIMER } from "@/lib/legal";
import { pdfLilaCellImagePath } from "./pdf-assets";
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

export type LilaPdfMove = FactsMove & { n: number };
export type LilaPdfInput = {
  intention: string;
  movesCount: number;
  finishedAt: Date;
  chapters: readonly StoredConclusionChapter[];
  moves: readonly LilaPdfMove[];
  assetsDir: string;
  demo?: boolean;
};

const COVER_SIDE = 80;
const BANNER_HEIGHT = 240;
const GRID_COLUMNS = 4;
const GRID_GAP = 12;
const THUMB = 46;
const SITE_URL = "https://tvoy-orakul.ru";
const LILA_URL = `${SITE_URL}/lila`;

const dateLabel = (date: Date): string => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Moscow" }).format(date);
const pad = (value: number): string => String(value).padStart(2, "0");

type Ctx = { doc: PdfDoc; input: LilaPdfInput; image: (cell: number) => string };

const cellName = (cell: number): string => lilaCellByNumber(cell).name;

// Картинка по размеру блока без искажений: лишнее обрезается, углы можно скруглить
function drawCellImage(ctx: Ctx, cell: number, x: number, y: number, width: number, height: number, radius = 0) {
  const { doc } = ctx;
  doc.save();
  if (radius > 0) doc.roundedRect(x, y, width, height, radius).clip();
  else doc.rect(x, y, width, height).clip();
  doc.image(ctx.image(cell), x, y, { cover: [width, height], align: "center", valign: "center" });
  doc.restore();
}

function drawOrnament(doc: PdfDoc, centerX: number, y: number, color: string) {
  doc.save();
  doc.lineWidth(0.6).strokeColor(color);
  doc.moveTo(centerX - 64, y).lineTo(centerX - 9, y).stroke();
  doc.moveTo(centerX + 9, y).lineTo(centerX + 64, y).stroke();
  doc.translate(centerX, y).rotate(45).rect(-3, -3, 6, 6).fill(color);
  doc.restore();
}

// Какие клетки показывать на обложке и в главах: каждой главе — своя клетка партии, повторов стараемся не допускать
function pickCells(moves: readonly LilaPdfMove[]) {
  const visits = lilaVisitCounts(moves.map((move) => ({ landed: move.landed, to: move.to, wasted: move.landed === move.from })));
  const order = [...visits.keys()];
  const noted = moves.filter((move) => move.note).map((move) => move.to);
  const mostVisited = [...visits.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const last = moves.at(-1)?.to ?? order.at(-1) ?? 1;
  const used = new Set<number>();
  const take = (candidates: readonly (number | undefined)[]): number => {
    const list = candidates.filter((cell): cell is number => cell !== undefined);
    const chosen = list.find((cell) => !used.has(cell)) ?? list[0] ?? 1;
    used.add(chosen);
    return chosen;
  };
  const cover = take([last]);
  const chapters: Record<LilaConclusionChapterId, number> = {
    path: take([order[0]]),
    repeats: take([mostVisited, ...order]),
    noticed: take([noted[0], ...noted, ...order]),
    outcome: take([...[...order].reverse()]),
  };
  return { cover, chapters, visits, last };
}

function drawCover(ctx: Ctx, cell: number, last: number) {
  const { doc, input } = ctx;
  const width = PAGE.width - 2 * COVER_SIDE;
  const centerX = PAGE.width / 2;
  const size = 300;
  const imageX = centerX - size / 2;
  const imageY = 92;
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.coverBg);
  drawCellImage(ctx, cell, imageX, imageY, size, size, 4);
  doc.lineWidth(0.9).strokeColor(COLORS.gold).roundedRect(imageX - 8, imageY - 8, size + 16, size + 16, 6).stroke();
  doc.lineWidth(0.4).strokeColor(COLORS.gold).opacity(0.5).roundedRect(imageX - 15, imageY - 15, size + 30, size + 30, 9).stroke().opacity(1);

  const textTop = imageY + size + 50;
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.gold);
  doc.text(`${input.demo ? "ДЕМОНСТРАЦИОННАЯ ПАРТИЯ ЛИЛЫ" : "ПАРТИЯ ЛИЛЫ"} · ${dateLabel(input.finishedAt)}`, COVER_SIDE, textTop, { width, align: "center", characterSpacing: 1.6 });
  const titleSize = input.intention.length <= 80 ? 27 : input.intention.length <= 160 ? 21 : 15;
  doc.font("display").fontSize(titleSize).fillColor(COLORS.coverInk);
  doc.text(input.intention, COVER_SIDE, doc.y + 16, { width, align: "center", lineGap: 4 });
  drawOrnament(doc, centerX, doc.y + 20, COLORS.gold);
  doc.font("body").fontSize(11).fillColor(COLORS.coverSoft);
  const summary = `Ходов: ${input.movesCount} · последняя клетка «${cellName(last)}»`;
  doc.text(input.demo ? `${summary}\nВымышленный вопрос и записи; главы написал ИИ. Ваш итог будет другим.` : `${summary}\nЭто материал для размышления, а не предсказание.`, COVER_SIDE, doc.y + 32, { width, align: "center", lineGap: 4 });
  // Без нулевого нижнего поля подпись у края страницы уходит на новую страницу
  doc.page.margins.bottom = 0;
  doc.font("bodyBold").fontSize(9).fillColor(COLORS.gold);
  doc.text("tvoy-orakul.ru", COVER_SIDE, PAGE.height - 58, { width, align: "center", characterSpacing: 1.2 });
}

function drawStat(doc: PdfDoc, x: number, y: number, width: number, value: number, label: string) {
  doc.roundedRect(x, y, width, 58, 8).fill(COLORS.highlight);
  doc.font("display").fontSize(26).fillColor(COLORS.accent).text(String(value), x, y + 8, { width, align: "center", lineBreak: false });
  doc.font("bodyBold").fontSize(7.5).fillColor(COLORS.muted).text(label, x, y + 41, { width, align: "center", characterSpacing: 0.8, lineBreak: false });
}

function drawOverview(ctx: Ctx, visits: ReadonlyMap<number, number>) {
  const { doc, input } = ctx;
  const facts = lilaFacts(input.moves);
  newPage(doc);
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.accent).text("ВАШ ПУТЬ", MARGIN.left, MARGIN.top, { width: CONTENT_WIDTH, characterSpacing: 1.6 });
  doc.font("display").fontSize(30).fillColor(COLORS.ink).text("Клетки вашей партии", MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH });
  doc.font("body").fontSize(11).fillColor(COLORS.muted).text("В порядке первого прихода. Число рядом с картинкой — сколько раз вы побывали на клетке.", MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH, lineGap: 3 });

  const statsTop = doc.y + 20;
  const gap = 10;
  const statWidth = (CONTENT_WIDTH - 3 * gap) / 4;
  const stats: readonly [number, string][] = [
    [facts.movesCount, "ХОДОВ"],
    [facts.openedCells, "КЛЕТОК"],
    [facts.snakes, "ЗМЕЙ"],
    [facts.arrows, "СТРЕЛ"],
  ];
  stats.forEach(([value, label], index) => drawStat(doc, MARGIN.left + index * (statWidth + gap), statsTop, statWidth, value, label));

  const cardWidth = (CONTENT_WIDTH - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS;
  const cardHeight = cardWidth + 38;
  let y = statsTop + 58 + 28;
  let column = 0;
  for (const [cell, count] of visits) {
    if (column === 0 && y + cardHeight > PAGE.height - MARGIN.bottom) {
      newPage(doc);
      y = MARGIN.top;
    }
    const x = MARGIN.left + column * (cardWidth + GRID_GAP);
    drawCellImage(ctx, cell, x, y, cardWidth, cardWidth, 6);
    doc.lineWidth(0.6).strokeColor(COLORS.gold).roundedRect(x, y, cardWidth, cardWidth, 6).stroke();
    if (count > 1) {
      doc.roundedRect(x + cardWidth - 34, y + 6, 28, 18, 9).fill(COLORS.coverBg);
      doc.font("bodyBold").fontSize(9).fillColor(COLORS.gold).text(`×${count}`, x + cardWidth - 34, y + 11, { width: 28, align: "center", lineBreak: false });
    }
    doc.font("bodyBold").fontSize(9).fillColor(COLORS.ink).text(cellName(cell), x, y + cardWidth + 7, { width: cardWidth, lineBreak: false, ellipsis: true });
    doc.font("body").fontSize(8).fillColor(COLORS.muted).text(`клетка ${cell}`, x, y + cardWidth + 21, { width: cardWidth, lineBreak: false });
    column += 1;
    if (column === GRID_COLUMNS) {
      column = 0;
      y += cardHeight + 6;
    }
  }
  if (column !== 0) y += cardHeight;
  doc.y = y;
}

function drawChapters(ctx: Ctx, chapterCells: Record<LilaConclusionChapterId, number>) {
  const { doc, input } = ctx;
  input.chapters.forEach((chapter, index) => {
    const cell = chapterCells[chapter.id];
    newPage(doc);
    drawCellImage(ctx, cell, 0, 0, PAGE.width, BANNER_HEIGHT);
    const gradient = doc.linearGradient(0, BANNER_HEIGHT * 0.25, 0, BANNER_HEIGHT);
    gradient.stop(0, COLORS.coverBg, 0).stop(1, COLORS.coverBg, 0.94);
    doc.rect(0, BANNER_HEIGHT * 0.25, PAGE.width, BANNER_HEIGHT * 0.75 + 1).fill(gradient);
    doc.fillOpacity(1);
    doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.gold).text(`ГЛАВА ${index + 1}`, MARGIN.left, BANNER_HEIGHT - 82, { width: CONTENT_WIDTH, characterSpacing: 1.8, lineBreak: false });
    doc.font("display").fontSize(30).fillColor(COLORS.coverInk).text(LILA_CONCLUSION_TITLES[chapter.id], MARGIN.left, BANNER_HEIGHT - 66, { width: CONTENT_WIDTH, lineBreak: false });
    doc.font("body").fontSize(8).fillColor(COLORS.coverSoft).text(`Клетка ${cell} · ${cellName(cell)}`, MARGIN.left, BANNER_HEIGHT - 22, { width: CONTENT_WIDTH, align: "right", lineBreak: false });
    doc.rect(0, BANNER_HEIGHT, PAGE.width, 2.5).fill(COLORS.gold);

    doc.y = BANNER_HEIGHT + 34;
    chapter.paragraphs.forEach((paragraph, paragraphIndex) => {
      // Первый абзац — вступление крупнее и шрифтом с засечками, как в журнале
      if (paragraphIndex === 0) doc.font("display").fontSize(15).fillColor(COLORS.ink).text(paragraph, MARGIN.left, doc.y, { width: CONTENT_WIDTH, lineGap: 5, paragraphGap: 14 });
      else doc.font("body").fontSize(11).fillColor(COLORS.ink).text(paragraph, MARGIN.left, doc.y, { width: CONTENT_WIDTH, lineGap: 4, paragraphGap: 10 });
    });
    // Украшение — только если помещается: пустая страница ради него не нужна
    if (doc.y + 30 < PAGE.height - MARGIN.bottom) drawOrnament(doc, PAGE.width / 2, doc.y + 14, COLORS.gold);
  });
}

function drawMoves(ctx: Ctx) {
  const { doc, input } = ctx;
  const moves = input.moves.filter((move) => move.landed !== move.from);
  newPage(doc);
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.accent).text("ПАРТИЯ ЦЕЛИКОМ", MARGIN.left, MARGIN.top, { width: CONTENT_WIDTH, characterSpacing: 1.6 });
  doc.font("display").fontSize(30).fillColor(COLORS.ink).text("Ход за ходом", MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH });
  doc.y += 14;
  const textX = MARGIN.left + THUMB + 16;
  const textWidth = CONTENT_WIDTH - THUMB - 16;
  moves.forEach((move, index) => {
    doc.font("body").fontSize(10);
    const noteHeight = move.note ? doc.heightOfString(move.note, { width: textWidth - 20, lineGap: 2.5 }) + 14 : 0;
    const rowHeight = (move.note ? 34 + noteHeight : THUMB) + 10;
    ensureSpace(doc, rowHeight);
    const top = doc.y;
    // Нить между миниатюрами — путь от хода к ходу
    if (index < moves.length - 1) doc.lineWidth(1).strokeColor(COLORS.gold).opacity(0.6).moveTo(MARGIN.left + THUMB / 2, top + THUMB + 2).lineTo(MARGIN.left + THUMB / 2, top + rowHeight - 2).stroke().opacity(1);
    drawCellImage(ctx, move.to, MARGIN.left, top, THUMB, THUMB, 6);
    doc.lineWidth(0.6).strokeColor(COLORS.gold).roundedRect(MARGIN.left, top, THUMB, THUMB, 6).stroke();
    doc.font("bodyBold").fontSize(8).fillColor(COLORS.accent).text(`ХОД ${move.n}`, textX, top + 2, { width: textWidth, characterSpacing: 1.2, lineBreak: false });
    doc.font("display").fontSize(14).fillColor(COLORS.ink).text(`${cellName(move.to)}`, textX, top + 14, { width: textWidth - 60, lineBreak: false, ellipsis: true });
    if (move.transition !== "none") {
      const label = move.transition === "snake" ? "ЗМЕЯ" : "СТРЕЛА";
      doc.roundedRect(MARGIN.left + CONTENT_WIDTH - 52, top + 15, 52, 15, 7.5).lineWidth(0.6).strokeColor(COLORS.accent).stroke();
      doc.font("bodyBold").fontSize(7).fillColor(COLORS.accent).text(label, MARGIN.left + CONTENT_WIDTH - 52, top + 20, { width: 52, align: "center", characterSpacing: 1, lineBreak: false });
    }
    if (move.note) {
      const boxTop = top + 34;
      doc.roundedRect(textX, boxTop, textWidth, noteHeight, 6).fill(COLORS.highlight);
      doc.rect(textX, boxTop + 3, 2.5, noteHeight - 6).fill(COLORS.gold);
      doc.font("body").fontSize(10).fillColor(COLORS.muted).text(move.note, textX + 12, boxTop + 7, { width: textWidth - 20, lineGap: 2.5 });
    }
    doc.y = top + rowHeight;
  });
}

// Последняя страница — тёмная, как обложка: вопросы той клетки, где партия остановилась, и приглашение к новой партии
function drawNext(ctx: Ctx, last: number) {
  const { doc } = ctx;
  const cell = lilaCellByNumber(last);
  const width = PAGE.width - 2 * COVER_SIDE;
  newPage(doc);
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.coverBg);
  // Текст у нижнего края не должен переносить страницу
  doc.page.margins.bottom = 0;
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.gold).text("КУДА СМОТРЕТЬ ДАЛЬШЕ", COVER_SIDE, 84, { width, align: "center", characterSpacing: 1.8 });
  doc.font("display").fontSize(26).fillColor(COLORS.coverInk).text(`Вопросы клетки «${cell.name}»`, COVER_SIDE, doc.y + 14, { width, align: "center", lineGap: 3 });
  drawOrnament(doc, PAGE.width / 2, doc.y + 18, COLORS.gold);
  let y = doc.y + 56;
  cell.questions.forEach((question, index) => {
    doc.font("display").fontSize(40).fillColor(COLORS.gold).text(String(index + 1), COVER_SIDE, y - 6, { width: 36, lineBreak: false });
    doc.font("body").fontSize(14).fillColor(COLORS.coverInk).text(question, COVER_SIDE + 48, y, { width: width - 48, lineGap: 5 });
    y = Math.max(doc.y, y + 40) + 34;
  });

  const ctaTop = Math.max(y + 24, 540);
  doc.font("display").fontSize(22).fillColor(COLORS.coverInk).text("Когда у вас появится новый вопрос, начните новую партию", COVER_SIDE, ctaTop, { width, align: "center", lineGap: 4 });
  doc.font("body").fontSize(11).fillColor(COLORS.coverSoft).text("Каждая партия идёт по-своему: другие броски, другие клетки, другие записи.", COVER_SIDE, doc.y + 12, { width, align: "center", lineGap: 3 });
  const buttonTop = doc.y + 24;
  const buttonWidth = 250;
  const buttonX = (PAGE.width - buttonWidth) / 2;
  doc.roundedRect(buttonX, buttonTop, buttonWidth, 40, 20).fill(COLORS.gold);
  doc.font("bodyBold").fontSize(11).fillColor(COLORS.coverBg).text("Начать партию · tvoy-orakul.ru/lila", buttonX, buttonTop + 14, { width: buttonWidth, align: "center", lineBreak: false });
  doc.link(buttonX, buttonTop, buttonWidth, 40, LILA_URL);
  doc.font("body").fontSize(8.5).fillColor(COLORS.coverSoft).text(DISCLAIMER, COVER_SIDE, buttonTop + 72, { width, align: "center", lineGap: 2 });
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
      const ctx: Ctx = { doc, input, image: (cell) => pdfLilaCellImagePath(input.assetsDir, lilaCellByNumber(cell)) };
      const picked = pickCells(input.moves);
      drawCover(ctx, picked.cover, picked.last);
      paintPagesLight(doc);
      drawOverview(ctx, picked.visits);
      drawChapters(ctx, picked.chapters);
      drawMoves(ctx);
      drawNext(ctx, picked.last);
      drawFooters(doc, new Set([doc.bufferedPageRange().count - 1]));
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
