import { CHAPTER_TITLES, reportChapters, SCENARIO_FIELDS, SCENARIO_TITLES, type Matrix } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import type { StoredChapter } from "@oracle/db";
import PDFDocument from "pdfkit";
import { DISCLAIMER } from "@/lib/legal";
import { chapterArcanaLabel, formatIsoDate, orderedChapters } from "@/lib/report-offer";
import { pdfArcanumImagePath, pdfFontPath } from "./pdf-assets";

const COLORS = {
  coverBg: "#0A090E",
  coverInk: "#F1E9DF",
  coverSoft: "#B9AFA5",
  gold: "#CBA676",
  paper: "#FBF7F0",
  ink: "#2B2219",
  muted: "#6E5A45",
  accent: "#8A6238",
  line: "#E4D8C4",
  highlight: "#F3E9D6",
} as const;

const PAGE = { width: 595.28, height: 841.89 } as const;
const MARGIN = { top: 56, bottom: 64, left: 56, right: 56 } as const;
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;
const COVER_ART_SIZE = 340;
const COVER_ART_TOP = 104;
const HIGHLIGHTED = new Set(["turningPoint", "experiment"]);

export type ReportPdfInput = { matrix: Matrix; birthDate: string; chapters: readonly StoredChapter[]; assetsDir: string };

type Doc = InstanceType<typeof PDFDocument>;

function drawCover(doc: Doc, input: ReportPdfInput) {
  const center = arcanumByNumber(input.matrix.E);
  const centerX = (PAGE.width - COVER_ART_SIZE) / 2;
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.coverBg);
  doc.image(pdfArcanumImagePath(input.assetsDir, center), centerX, COVER_ART_TOP, { width: COVER_ART_SIZE, height: COVER_ART_SIZE });
  doc.rect(centerX, COVER_ART_TOP, COVER_ART_SIZE, COVER_ART_SIZE).lineWidth(0.8).stroke(COLORS.gold);

  const width = PAGE.width - 2 * 80;
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.gold);
  doc.text(`РАЗБОР МАТРИЦЫ СУДЬБЫ · ПО ДАТЕ ${formatIsoDate(input.birthDate)}`, 80, COVER_ART_TOP + COVER_ART_SIZE + 48, { width, align: "center", characterSpacing: 1.6 });
  doc.font("display").fontSize(34).fillColor(COLORS.coverInk);
  doc.text(`Ваш центр — ${center.name}`, 80, doc.y + 18, { width, align: "center", lineGap: 4 });
  doc.font("body").fontSize(12).fillColor(COLORS.coverSoft);
  doc.text("Семь глав о том, как устроена ваша матрица. Это материал для размышления, а не предсказание.", 80, doc.y + 16, { width, align: "center", lineGap: 4 });
  // Без нулевого нижнего поля подпись у края страницы уходит на новую страницу
  doc.page.margins.bottom = 0;
  doc.font("bodyBold").fontSize(9).fillColor(COLORS.gold);
  doc.text("tvoy-orakul.ru", 80, PAGE.height - 72, { width, align: "center", characterSpacing: 1.2 });
}

function newPage(doc: Doc) {
  doc.addPage();
}

function drawContents(doc: Doc, input: ReportPdfInput) {
  doc.font("display").fontSize(26).fillColor(COLORS.ink).text("Оглавление", MARGIN.left, MARGIN.top);
  let y = doc.y + 22;
  for (const [index, chapter] of reportChapters(input.matrix).entries()) {
    doc.moveTo(MARGIN.left, y - 8).lineTo(PAGE.width - MARGIN.right, y - 8).lineWidth(0.5).stroke(COLORS.line);
    doc.font("display").fontSize(20).fillColor(COLORS.accent).text(String(index + 1), MARGIN.left, y - 2, { width: 30 });
    doc.font("bodyBold").fontSize(12.5).fillColor(COLORS.ink).text(chapter.title, MARGIN.left + 38, y, { width: CONTENT_WIDTH - 38 });
    doc.font("body").fontSize(9.5).fillColor(COLORS.muted).text(chapterArcanaLabel(chapter), MARGIN.left + 38, doc.y + 3, { width: CONTENT_WIDTH - 38 });
    y = doc.y + 18;
  }
}

// Место под заголовок главы и хотя бы несколько строк; иначе заголовок остался бы внизу страницы один
function ensureSpace(doc: Doc, needed: number) {
  if (doc.y + needed > PAGE.height - MARGIN.bottom) newPage(doc);
}

function drawScenario(doc: Doc, chapter: StoredChapter) {
  for (const field of SCENARIO_FIELDS) {
    const text = chapter.scenario?.[field] ?? "";
    const highlighted = HIGHLIGHTED.has(field);
    const padding = highlighted ? 12 : 0;
    const innerWidth = CONTENT_WIDTH - 2 * padding;
    doc.font("body").fontSize(11);
    const textHeight = doc.heightOfString(text, { width: innerWidth, lineGap: 3 });
    ensureSpace(doc, textHeight + 2 * padding + 30);
    const top = doc.y + 6;
    if (highlighted) {
      doc.rect(MARGIN.left, top, CONTENT_WIDTH, textHeight + 2 * padding + 22).fill(COLORS.highlight);
      doc.rect(MARGIN.left, top, 3, textHeight + 2 * padding + 22).fill(COLORS.accent);
    }
    doc.font("bodyBold").fontSize(9.5).fillColor(COLORS.accent).text(SCENARIO_TITLES[field].toUpperCase(), MARGIN.left + padding, top + padding, { width: innerWidth, characterSpacing: 1 });
    doc.font("body").fontSize(11).fillColor(COLORS.ink).text(text, MARGIN.left + padding, doc.y + 5, { width: innerWidth, lineGap: 3 });
    doc.y = top + textHeight + 2 * padding + 22 + 10;
  }
}

function drawChapter(doc: Doc, chapter: StoredChapter, number: number, arcana: readonly number[]) {
  ensureSpace(doc, chapter.id === "scenario" ? 260 : 190);
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.accent).text(`ГЛАВА ${number}`, MARGIN.left, doc.y, { characterSpacing: 1.6 });
  doc.font("display").fontSize(24).fillColor(COLORS.ink).text(CHAPTER_TITLES[chapter.id], MARGIN.left, doc.y + 4, { width: CONTENT_WIDTH });
  if (arcana.length > 0) {
    const label = arcana.map((value) => `${value} ${arcanumByNumber(value).name}`).join(" · ");
    doc.font("bodyBold").fontSize(9.5).fillColor(COLORS.muted).text(label, MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH });
  }
  doc.moveDown(0.8);
  for (const paragraph of chapter.paragraphs ?? []) {
    doc.font("body").fontSize(11).fillColor(COLORS.ink).text(paragraph, MARGIN.left, doc.y, { width: CONTENT_WIDTH, lineGap: 3.5, paragraphGap: 9 });
  }
  if (chapter.scenario) drawScenario(doc, chapter);
  doc.y += 26;
}

function drawFooters(doc: Doc) {
  const { count } = doc.bufferedPageRange();
  for (let index = 1; index < count; index += 1) {
    doc.switchToPage(index);
    // Без нулевого нижнего поля текст в колонтитуле вызвал бы добавление новой страницы
    doc.page.margins.bottom = 0;
    doc.font("body").fontSize(8.5).fillColor(COLORS.muted);
    doc.text("Твой оракул · tvoy-orakul.ru", MARGIN.left, PAGE.height - 40, { width: CONTENT_WIDTH / 2, lineBreak: false });
    doc.text(String(index + 1), MARGIN.left + CONTENT_WIDTH / 2, PAGE.height - 40, { width: CONTENT_WIDTH / 2, align: "right", lineBreak: false });
  }
}

export function buildReportPdf(input: ReportPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE.width, PAGE.height],
      margins: MARGIN,
      bufferPages: true,
      info: { Title: "Разбор матрицы судьбы", Author: "Твой оракул", Subject: `Разбор по дате ${formatIsoDate(input.birthDate)}` },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      doc.registerFont("body", pdfFontPath(input.assetsDir, "body"));
      doc.registerFont("bodyBold", pdfFontPath(input.assetsDir, "bodyBold"));
      doc.registerFont("display", pdfFontPath(input.assetsDir, "display"));

      drawCover(doc, input);
      // Остальные страницы светлые: их удобнее читать с экрана и печатать
      doc.on("pageAdded", () => {
        doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.paper);
        doc.fillColor(COLORS.ink);
      });
      newPage(doc);
      drawContents(doc, input);
      // Оглавление занимает страницу целиком; главы начинаются с новой
      newPage(doc);

      const toc = reportChapters(input.matrix);
      const arcanaOf = new Map(toc.map((chapter) => [chapter.id, chapter.arcana]));
      for (const chapter of orderedChapters(input.chapters)) {
        const number = toc.findIndex((item) => item.id === chapter.id) + 1;
        drawChapter(doc, chapter, number, chapter.id === "scenario" ? [] : (arcanaOf.get(chapter.id) ?? []));
      }

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
