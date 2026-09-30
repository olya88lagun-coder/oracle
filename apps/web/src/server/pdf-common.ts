import PDFDocument from "pdfkit";
import { pdfFontPath } from "./pdf-assets";

export const PDF_COLORS = {
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

export const PDF_PAGE = { width: 595.28, height: 841.89 } as const;
export const PDF_MARGIN = { top: 56, bottom: 64, left: 56, right: 56 } as const;
export const PDF_CONTENT_WIDTH = PDF_PAGE.width - PDF_MARGIN.left - PDF_MARGIN.right;

export type PdfDoc = InstanceType<typeof PDFDocument>;

export function createPdfDoc(info: { Title: string; Subject: string }): PdfDoc {
  return new PDFDocument({ size: [PDF_PAGE.width, PDF_PAGE.height], margins: PDF_MARGIN, bufferPages: true, info: { ...info, Author: "Твой оракул" } });
}

export function registerPdfFonts(doc: PdfDoc, assetsDir: string): void {
  doc.registerFont("body", pdfFontPath(assetsDir, "body"));
  doc.registerFont("bodyBold", pdfFontPath(assetsDir, "bodyBold"));
  doc.registerFont("display", pdfFontPath(assetsDir, "display"));
}

export function newPage(doc: PdfDoc): void {
  doc.addPage();
}

// Место под заголовок главы и хотя бы несколько строк; иначе заголовок остался бы внизу страницы один
export function ensureSpace(doc: PdfDoc, needed: number): void {
  if (doc.y + needed > PDF_PAGE.height - PDF_MARGIN.bottom) newPage(doc);
}

// Остальные страницы светлые: их удобнее читать с экрана и печатать
export function paintPagesLight(doc: PdfDoc): void {
  doc.on("pageAdded", () => {
    doc.rect(0, 0, PDF_PAGE.width, PDF_PAGE.height).fill(PDF_COLORS.paper);
    doc.fillColor(PDF_COLORS.ink);
  });
}

export function drawFooters(doc: PdfDoc): void {
  const { count } = doc.bufferedPageRange();
  for (let index = 1; index < count; index += 1) {
    doc.switchToPage(index);
    // Без нулевого нижнего поля текст в колонтитуле вызвал бы добавление новой страницы
    doc.page.margins.bottom = 0;
    doc.font("body").fontSize(8.5).fillColor(PDF_COLORS.muted);
    doc.text("Твой оракул · tvoy-orakul.ru", PDF_MARGIN.left, PDF_PAGE.height - 40, { width: PDF_CONTENT_WIDTH / 2, lineBreak: false });
    doc.text(String(index + 1), PDF_MARGIN.left + PDF_CONTENT_WIDTH / 2, PDF_PAGE.height - 40, { width: PDF_CONTENT_WIDTH / 2, align: "right", lineBreak: false });
  }
}
