import { SCENARIO_FIELDS, SCENARIO_TITLES, type ScenarioField } from "@oracle/core";
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
  type PdfDoc as Doc,
} from "./pdf-common";

const HIGHLIGHTED = new Set<ScenarioField>(["turningPoint", "experiment"]);
const COVER_IMAGE_HEIGHT = 340;
const FADE_HEIGHT = 150;
const GALLERY_SIZE = 112;
const GALLERY_GAP = 14;
const BANNER_HEIGHT = 150;

export type GalleryImage = { path: string; caption: string };
export type TextReportChapter = {
  title: string;
  // Картинка-вставка над заголовком главы и ряд гравюр с подписями под ним
  banner?: string;
  gallery?: readonly GalleryImage[];
  blocks?: readonly { heading?: string; paragraphs: readonly string[] }[];
  scenario?: Readonly<Record<ScenarioField, string>>;
};
export type TextReportInput = {
  title: string;
  eyebrow: string;
  lead: string;
  chapters: readonly TextReportChapter[];
  assetsDir: string;
  // Картинка в верхней части обложки; coverExtra дорисовывает обложку; intro рисует отдельную страницу между обложкой и оглавлением
  coverImage?: string;
  coverExtra?: (doc: Doc) => void;
  intro?: (doc: Doc) => void;
};

// pdfkit при cover масштабирует картинку, но не обрезает: лишнее убирает область отсечения
function drawCroppedImage(doc: Doc, path: string, x: number, y: number, width: number, height: number): void {
  doc.save();
  doc.rect(x, y, width, height).clip();
  doc.image(path, x, y, { cover: [width, height], align: "center", valign: "center" });
  doc.restore();
}

// Рамка в цвет золота вокруг тёмной гравюры: на светлой странице картинка не «тонет»
export function drawFramedImage(doc: Doc, path: string, x: number, y: number, size: number): void {
  doc.image(path, x, y, { width: size, height: size });
  doc.rect(x, y, size, size).lineWidth(0.8).stroke(COLORS.gold);
}

function drawCover(doc: Doc, input: TextReportInput) {
  const width = PAGE.width - 2 * 80;
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.coverBg);
  if (input.coverImage) {
    drawCroppedImage(doc, input.coverImage, 0, 0, PAGE.width, COVER_IMAGE_HEIGHT);
    // Нижний край картинки плавно уходит в фон обложки
    const fade = doc.linearGradient(0, COVER_IMAGE_HEIGHT - FADE_HEIGHT, 0, COVER_IMAGE_HEIGHT);
    fade.stop(0, COLORS.coverBg, 0).stop(1, COLORS.coverBg, 1);
    doc.rect(0, COVER_IMAGE_HEIGHT - FADE_HEIGHT, PAGE.width, FADE_HEIGHT + 1).fill(fade);
  }
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.gold);
  doc.text(input.eyebrow.toUpperCase(), 80, input.coverImage ? 352 : 300, { width, align: "center", characterSpacing: 1.6 });
  doc.font("display").fontSize(34).fillColor(COLORS.coverInk);
  doc.text(input.title, 80, doc.y + 18, { width, align: "center", lineGap: 4 });
  doc.font("body").fontSize(12).fillColor(COLORS.coverSoft);
  doc.text(input.lead, 80, doc.y + 16, { width, align: "center", lineGap: 4 });
  input.coverExtra?.(doc);
  // Без нулевого нижнего поля подпись у края страницы уходит на новую страницу
  doc.page.margins.bottom = 0;
  doc.font("bodyBold").fontSize(9).fillColor(COLORS.gold);
  doc.text("tvoy-orakul.ru", 80, PAGE.height - 72, { width, align: "center", characterSpacing: 1.2 });
}

function drawContents(doc: Doc, chapters: readonly TextReportChapter[]) {
  doc.font("display").fontSize(26).fillColor(COLORS.ink).text("Оглавление", MARGIN.left, MARGIN.top);
  let y = doc.y + 22;
  for (const [index, chapter] of chapters.entries()) {
    doc.moveTo(MARGIN.left, y - 8).lineTo(PAGE.width - MARGIN.right, y - 8).lineWidth(0.5).stroke(COLORS.line);
    doc.font("display").fontSize(20).fillColor(COLORS.accent).text(String(index + 1), MARGIN.left, y - 2, { width: 30 });
    doc.font("bodyBold").fontSize(12.5).fillColor(COLORS.ink).text(chapter.title, MARGIN.left + 38, y, { width: CONTENT_WIDTH - 38 });
    y = doc.y + 18;
  }
}

function drawScenario(doc: Doc, scenario: Readonly<Record<ScenarioField, string>>) {
  for (const field of SCENARIO_FIELDS) {
    const text = scenario[field] ?? "";
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

function drawGallery(doc: Doc, gallery: readonly GalleryImage[]) {
  const size = Math.min(GALLERY_SIZE, (CONTENT_WIDTH - GALLERY_GAP * (gallery.length - 1)) / gallery.length);
  const top = doc.y + 4;
  for (const [index, item] of gallery.entries()) {
    const x = MARGIN.left + index * (size + GALLERY_GAP);
    drawFramedImage(doc, item.path, x, top, size);
    doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.muted).text(item.caption, x, top + size + 6, { width: size, align: "center", lineGap: 1 });
  }
  doc.y = top + size + 40;
}

function drawChapter(doc: Doc, chapter: TextReportChapter, number: number) {
  ensureSpace(doc, (chapter.scenario ? 260 : 190) + (chapter.gallery ? GALLERY_SIZE + 40 : 0) + (chapter.banner ? BANNER_HEIGHT + 20 : 0));
  if (chapter.banner) {
    const top = doc.y;
    drawCroppedImage(doc, chapter.banner, MARGIN.left, top, CONTENT_WIDTH, BANNER_HEIGHT);
    doc.rect(MARGIN.left, top, CONTENT_WIDTH, BANNER_HEIGHT).lineWidth(0.8).stroke(COLORS.gold);
    doc.y = top + BANNER_HEIGHT + 20;
  }
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.accent).text(`ГЛАВА ${number}`, MARGIN.left, doc.y, { characterSpacing: 1.6 });
  doc.font("display").fontSize(24).fillColor(COLORS.ink).text(chapter.title, MARGIN.left, doc.y + 4, { width: CONTENT_WIDTH });
  doc.moveDown(0.8);
  if (chapter.gallery && chapter.gallery.length > 0) drawGallery(doc, chapter.gallery);
  for (const block of chapter.blocks ?? []) {
    if (block.heading) {
      ensureSpace(doc, 80);
      doc.font("bodyBold").fontSize(12.5).fillColor(COLORS.ink).text(block.heading, MARGIN.left, doc.y + 4, { width: CONTENT_WIDTH, paragraphGap: 6 });
    }
    for (const paragraph of block.paragraphs) {
      doc.font("body").fontSize(11).fillColor(COLORS.ink).text(paragraph, MARGIN.left, doc.y, { width: CONTENT_WIDTH, lineGap: 3.5, paragraphGap: 9 });
    }
  }
  if (chapter.scenario) drawScenario(doc, chapter.scenario);
  doc.y += 26;
}

// Разбор с картинками: обложка, страница с рисунком (колесо или нить), оглавление и главы. Для натального разбора и разбора нити (у матрицы своя вёрстка с арканами)
export function buildTextReportPdf(input: TextReportInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = createPdfDoc({ Title: input.title, Subject: input.eyebrow });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      registerPdfFonts(doc, input.assetsDir);
      drawCover(doc, input);
      paintPagesLight(doc);
      if (input.intro) {
        newPage(doc);
        input.intro(doc);
      }
      newPage(doc);
      drawContents(doc, input.chapters);
      // Оглавление занимает страницу целиком; главы начинаются с новой
      newPage(doc);
      for (const [index, chapter] of input.chapters.entries()) drawChapter(doc, chapter, index + 1);

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
