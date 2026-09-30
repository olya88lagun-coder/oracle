import { arcanumByNumber } from "@oracle/content";
import { compatUnionByNumber } from "@oracle/content/compat";
import { KEY_POINTS, type Compatibility } from "@oracle/core";
import { compatSummary, POINT_LABELS } from "@/lib/compat";
import { DISCLAIMER } from "@/lib/legal";
import { pdfArcanumImagePath } from "./pdf-assets";
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

// В сборщик приходит готовый расчёт (номера арканов): дат рождения здесь нет и в файл они не попадают
export type CompatPdfInput = { compat: Compatibility; madeAt: Date; assetsDir: string };

const COVER_SIDE = 80;
const COVER_ART = 300;
const COVER_ART_TOP = 96;
const dateLabel = (date: Date) => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Moscow" }).format(date);

function drawCover(doc: PdfDoc, input: CompatPdfInput) {
  const arcanum = arcanumByNumber(input.compat.pair);
  const width = PAGE.width - 2 * COVER_SIDE;
  const artX = (PAGE.width - COVER_ART) / 2;
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.coverBg);
  doc.image(pdfArcanumImagePath(input.assetsDir, arcanum), artX, COVER_ART_TOP, { width: COVER_ART, height: COVER_ART });
  doc.rect(artX, COVER_ART_TOP, COVER_ART, COVER_ART).lineWidth(0.8).stroke(COLORS.gold);
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.gold);
  doc.text(`СОВМЕСТИМОСТЬ · ${dateLabel(input.madeAt)}`, COVER_SIDE, COVER_ART_TOP + COVER_ART + 44, { width, align: "center", characterSpacing: 1.6 });
  doc.font("display").fontSize(32).fillColor(COLORS.coverInk);
  doc.text(`Аркан вашей пары — ${arcanum.name}`, COVER_SIDE, doc.y + 16, { width, align: "center", lineGap: 4 });
  doc.font("body").fontSize(12).fillColor(COLORS.coverSoft);
  doc.text("Материал для разговора и размышления, а не прогноз и не оценка отношений.", COVER_SIDE, doc.y + 16, { width, align: "center", lineGap: 4 });
  // Без нулевого нижнего поля подпись у края страницы уходит на новую страницу
  doc.page.margins.bottom = 0;
  doc.font("bodyBold").fontSize(9).fillColor(COLORS.gold);
  doc.text("tvoy-orakul.ru", COVER_SIDE, PAGE.height - 72, { width, align: "center", characterSpacing: 1.2 });
}

function drawUnion(doc: PdfDoc, compat: Compatibility) {
  const union = compatUnionByNumber(compat.pair);
  doc.font("display").fontSize(24).fillColor(COLORS.ink).text("Ваш союз", MARGIN.left, MARGIN.top, { width: CONTENT_WIDTH });
  doc.moveDown(0.8);
  const block = (title: string, text: string) => {
    ensureSpace(doc, 90);
    doc.font("bodyBold").fontSize(9.5).fillColor(COLORS.accent).text(title.toUpperCase(), MARGIN.left, doc.y, { width: CONTENT_WIDTH, characterSpacing: 1 });
    doc.font("body").fontSize(11).fillColor(COLORS.ink).text(text, MARGIN.left, doc.y + 4, { width: CONTENT_WIDTH, lineGap: 3.5, paragraphGap: 9 });
    doc.y += 12;
  };
  block("Суть союза", union.essence);
  block("Что даёт", union.gives);
  block("Где стоит присмотреться", union.attention);
  block("Вопрос для двоих", union.question);
}

function drawPeople(doc: PdfDoc, compat: Compatibility) {
  newPage(doc);
  doc.font("display").fontSize(24).fillColor(COLORS.ink).text("Вы и партнёр", MARGIN.left, MARGIN.top, { width: CONTENT_WIDTH });
  doc.moveDown(0.8);
  for (const [index, person] of compat.people.entries()) {
    ensureSpace(doc, 120);
    doc.font("bodyBold").fontSize(12).fillColor(COLORS.accent).text(index === 0 ? "Вы" : "Партнёр", MARGIN.left, doc.y, { width: CONTENT_WIDTH });
    for (const point of KEY_POINTS) {
      const arcanum = arcanumByNumber(person[point]);
      ensureSpace(doc, 60);
      doc.font("body").fontSize(11).fillColor(COLORS.ink).text(`${POINT_LABELS[point]}: аркан ${arcanum.number} «${arcanum.name}»`, MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH });
    }
    doc.y += 14;
  }
  ensureSpace(doc, 80);
  doc.font("display").fontSize(18).fillColor(COLORS.ink).text("Где вы похожи и где различаетесь", MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH });
  for (const line of compatSummary(compat, (number) => arcanumByNumber(number).name)) {
    ensureSpace(doc, 40);
    doc.font("body").fontSize(11).fillColor(COLORS.ink).text(line, MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH, lineGap: 3 });
  }
}

export function buildCompatPdf(input: CompatPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = createPdfDoc({ Title: "Совместимость по дате рождения", Subject: `Аркан пары ${input.compat.pair}` });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      registerPdfFonts(doc, input.assetsDir);
      drawCover(doc, input);
      paintPagesLight(doc);
      newPage(doc);
      drawUnion(doc, input.compat);
      drawPeople(doc, input.compat);
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
