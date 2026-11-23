import type { NatalChart } from "@oracle/core/natal";
import { buildWheel, WHEEL_VIEW_SIZE, type Box, type Segment } from "@/lib/natal-wheel";
import { GLYPH_STROKE, GLYPHS } from "./natal-glyph-data";
import type { PdfDoc as Doc } from "./pdf-common";

// Колесо натальной карты на тёмной панели: та же модель buildWheel, что рисует сайт, только пером pdfkit.
// Координаты модели 720×720; колесо переносится в квадрат size × size и масштабируется целиком, шрифты и линии вместе с ним
export const WHEEL_PALETTE = {
  panel: "#0A090E",
  gold: "#CBA676",
  line: "#6E5B43",
  ink: "#F1E9DF",
  soft: "#B9AFA5",
  lavender: "#A99BD0",
  good: "#8FB89A",
} as const;
const P = WHEEL_PALETTE;

const ASPECT_STYLE: Readonly<Record<string, { color: string; width: number; dash?: [number, number] }>> = {
  trine: { color: P.good, width: 1.15 },
  sextile: { color: P.gold, width: 1, dash: [4, 6] },
  square: { color: P.lavender, width: 1.7 },
  opposition: { color: P.lavender, width: 2.1 },
  conjunction: { color: P.ink, width: 1.5 },
};

export function drawGlyph(doc: Doc, id: string, box: Box, color: string): void {
  const shapes = GLYPHS[id];
  if (!shapes) return;
  doc.save();
  doc.translate(box.x, box.y).scale(box.width / 24);
  doc.lineWidth(GLYPH_STROKE).lineCap("round").lineJoin("round");
  for (const shape of shapes) {
    if ("d" in shape) doc.path(shape.d).stroke(color);
    else if (shape.fill) doc.circle(shape.cx, shape.cy, shape.r).fill(color);
    else doc.circle(shape.cx, shape.cy, shape.r).stroke(color);
  }
  doc.restore();
}

const line = (doc: Doc, { x1, y1, x2, y2 }: Segment) => doc.moveTo(x1, y1).lineTo(x2, y2);

// Подпись по центру точки, как text-anchor: middle и dominant-baseline: central в SVG
function centred(doc: Doc, text: string, x: number, y: number, fontSize: number, color: string, rotate = 0, font = "body"): void {
  doc.save();
  doc.translate(x, y).rotate(rotate);
  // В шрифте текста нет знаков минут и секунд (′ ″): вместо них обычные кавычки
  const shown = text.replace("′", "'").replace("″", '"');
  doc.font(font).fontSize(fontSize).fillColor(color);
  doc.text(shown, -doc.widthOfString(shown) / 2, -fontSize * 0.36, { lineBreak: false });
  doc.restore();
}

export function drawNatalWheel(doc: Doc, chart: NatalChart, x: number, y: number, size: number): void {
  const model = buildWheel(chart);
  doc.save();
  doc.translate(x, y).scale(size / WHEEL_VIEW_SIZE);

  for (const circle of model.circles) doc.circle(360, 360, circle.r).lineWidth(circle.outer ? 1.3 : 1.1).stroke(circle.outer ? P.gold : P.line);
  for (const tick of model.ticks) line(doc, tick).lineWidth(tick.major ? 1.2 : 1).stroke(tick.major ? P.gold : P.line);
  for (const sector of model.sectors) line(doc, sector).lineWidth(1).stroke(P.line);
  for (const sign of model.signs) drawGlyph(doc, sign.glyph, sign, P.gold);

  for (const house of model.houses ?? []) {
    line(doc, house.line).lineWidth(house.axis ? 1.7 : 1.2).stroke(house.axis ? P.gold : P.line);
    if (house.extension) {
      doc.opacity(house.extension.opacity);
      line(doc, house.extension).lineWidth(1.7).stroke(P.gold);
      doc.opacity(1);
    }
    centred(doc, house.number.text, house.number.x, house.number.y, 26, P.soft);
  }

  for (const { aspect, opacity, shape } of model.aspects) {
    const style = ASPECT_STYLE[aspect] ?? ASPECT_STYLE.conjunction!;
    doc.opacity(opacity).lineWidth(style.width);
    if (style.dash) doc.dash(style.dash[0], { space: style.dash[1] });
    if (shape.kind === "circle") doc.circle(shape.cx, shape.cy, shape.r).stroke(style.color);
    else line(doc, shape).stroke(style.color);
    doc.undash().opacity(1);
  }

  for (const point of model.points) {
    const [first, ...rest] = point.leader;
    if (first) {
      doc.moveTo(first.x, first.y);
      for (const next of rest) doc.lineTo(next.x, next.y);
      doc.opacity(0.75).lineWidth(1).stroke(P.soft).opacity(1);
    }
    doc.circle(point.marker.cx, point.marker.cy, point.marker.r).fill(P.gold);
    const color = point.body === "sun" || point.body === "moon" ? P.gold : point.body === "node" ? P.lavender : P.ink;
    drawGlyph(doc, point.glyph, point.glyphBox, color);
    if (point.retroBox) drawGlyph(doc, "glyph-retro", point.retroBox, color);
    centred(doc, point.degree.text, point.degree.x, point.degree.y, 20, P.soft, point.degree.rotate);
    if (point.warning) {
      doc.circle(point.warning.cx, point.warning.cy, point.warning.r).stroke(P.lavender);
      doc.lineWidth(1.7).path(point.warning.mark).stroke(P.lavender);
    }
  }

  for (const angle of model.angles ? [model.angles.ascendant, model.angles.midheaven] : []) {
    centred(doc, angle.label, angle.text.x, angle.text.y, 26, P.gold, 0, "bodyBold");
    doc.circle(angle.node.cx, angle.node.cy, angle.node.r).lineWidth(1.6).fillAndStroke(P.panel, P.gold);
  }
  if (model.centre) {
    doc.circle(360, 360, model.centre.r).lineWidth(1).stroke(P.line);
    doc.path(model.centre.cross).stroke(P.line);
  }
  doc.restore();
}
