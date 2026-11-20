import { discLitPath } from "@oracle/core/moon/visual";
import { COLORS, loadImage, POSTER_SIZE, roundRect } from "./poster";
import type { MoonPosterSpec } from "./poster-moon";

type Fonts = { serif: string; sans: string };
type Ctx = CanvasRenderingContext2D;

const GOLD = "#CBA676";
const GOLD_SOFT = "rgba(203, 166, 118, 0.55)";
const IVORY = "#EFE0C5";
const SHADOW = "#292530";
const RIM = "#806951";
const TEXTURE = "/images/moon/moon-surface.webp";

// Звёзды в фоне всегда в одних и тех же местах: картинка не зависит от случайности
function starfield(ctx: Ctx, width: number, height: number) {
  let seed = 7;
  const next = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 150; i++) {
    const x = next() * width;
    const y = next() * height;
    const size = 1 + next() * 2.2;
    ctx.fillStyle = `rgba(241, 214, 170, ${0.25 + next() * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Четырёхлучевая звезда
function star(ctx: Ctx, x: number, y: number, radius: number) {
  const inner = radius * 0.16;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const r = i % 2 === 0 ? radius : inner;
    ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fill();
}

// Полумесяц: круг без смещённого круга; direction 1 — рога влево, −1 — вправо
function crescent(ctx: Ctx, x: number, y: number, radius: number, direction: 1 | -1) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.arc(x + direction * radius * 0.55, y, radius * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill("evenodd");
  ctx.restore();
}

// Двойная рамка и лучи в углах
function frame(ctx: Ctx, width: number, height: number) {
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  roundRect(ctx, 22, 22, width - 44, height - 44, 26);
  ctx.stroke();
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 1.5;
  roundRect(ctx, 42, 42, width - 84, height - 84, 18);
  ctx.stroke();
  const corners: [number, number, number, number][] = [[42, 42, 1, 1], [width - 42, 42, -1, 1], [42, height - 42, 1, -1], [width - 42, height - 42, -1, -1]];
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 2;
  for (const [cx, cy, dx, dy] of corners) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 2) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(cx + dx * 34 * Math.cos(angle), cy + dy * 34 * Math.sin(angle));
      ctx.lineTo(cx + dx * 120 * Math.cos(angle), cy + dy * 120 * Math.sin(angle));
      ctx.stroke();
    }
  }
}

// Кольца вокруг диска: два сплошных, пунктир и восемь узлов на внешнем кольце
function rings(ctx: Ctx, cx: number, cy: number) {
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 2;
  for (const radius of [330, 352]) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = GOLD_SOFT;
  for (let i = 0; i < 90; i++) {
    const angle = (Math.PI * 2 * i) / 90;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * 308, cy + Math.sin(angle) * 308, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = GOLD;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * 352;
    const y = cy + Math.sin(angle) * 352;
    if (i % 2 === 0) star(ctx, x, y, 46);
    else {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Диск по точной освещённости: тень, свет по пути из ядра сайта и рельеф поверхности внутри света (как на странице «Луна сегодня»)
function disc(ctx: Ctx, cx: number, cy: number, radius: number, texture: HTMLImageElement, illumination: number, waxing: boolean) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = SHADOW;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.22;
  ctx.drawImage(texture, -radius, -radius, radius * 2, radius * 2);
  ctx.restore();
  const path = discLitPath(illumination, waxing, radius);
  if (path) {
    const lit = new Path2D(path);
    ctx.fillStyle = IVORY;
    ctx.fill(lit);
    ctx.save();
    ctx.clip(lit);
    ctx.drawImage(texture, -radius, -radius, radius * 2, radius * 2);
    // Тёплый тон: серая текстура поверхности окрашивается в золото, как вся гравюра
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(226, 178, 96, 0.85)";
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// Рамка-плашка с текстом; возвращает y следующей строки
function pill(ctx: Ctx, text: string, cx: number, y: number, width: number, height: number, font: string) {
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  roundRect(ctx, cx - width / 2, y, width, height, height / 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(203, 166, 118, 0.07)";
  roundRect(ctx, cx - width / 2, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, y + height / 2 + 3);
  ctx.textBaseline = "alphabetic";
}

// Знак Луны: круглая вставка из гравюры знака (центральная часть — фигура на фоне Луны) в золотом кольце с веточками по бокам
function medallion(ctx: Ctx, cx: number, cy: number, radius: number, image: HTMLImageElement | null) {
  if (image) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    const side = image.naturalWidth * 0.62;
    const sx = (image.naturalWidth - side) / 2;
    const sy = image.naturalHeight * 0.2;
    ctx.drawImage(image, sx, sy, side, side, cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
  }
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 22, 0, Math.PI * 2);
  ctx.stroke();
  // Веточки: по семь листиков слева и справа вдоль дуги, листик повёрнут по касательной
  ctx.fillStyle = GOLD_SOFT;
  const ring = radius + 52;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const left = (Math.PI / 180) * (105 + (i / 6) * 120);
      const angle = side === -1 ? left : Math.PI - left;
      ctx.save();
      ctx.translate(cx + Math.cos(angle) * ring, cy + Math.sin(angle) * ring);
      // Длинная ось листика (вертикальная) ложится вдоль касательной к кольцу
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// Значок восхода или захода: полусолнце над линией горизонта
function horizon(ctx: Ctx, x: number, y: number) {
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 22, Math.PI, 0);
  ctx.stroke();
  for (const offset of [0, 12, 24]) {
    ctx.beginPath();
    ctx.moveTo(x - 44 + offset / 2, y + 12 + offset);
    ctx.lineTo(x + 44 - offset / 2, y + 12 + offset);
    ctx.stroke();
  }
}

export async function renderMoonPoster(spec: MoonPosterSpec, fonts: Fonts): Promise<Blob> {
  const { width, height } = POSTER_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  await document.fonts.ready;
  const [texture, sign] = await Promise.all([loadImage(TEXTURE), spec.signImage ? loadImage(spec.signImage).catch(() => null) : Promise.resolve(null)]);
  const cx = width / 2;

  // Фон: тёмный с лиловым свечением вверху и внизу и звёздами
  ctx.fillStyle = "#0B0812";
  ctx.fillRect(0, 0, width, height);
  for (const [gx, gy, color] of [[cx, 700, "rgba(120, 82, 160, 0.30)"], [cx, 1500, "rgba(96, 60, 130, 0.22)"], [cx, 120, "rgba(110, 70, 150, 0.18)"]] as const) {
    const glow = ctx.createRadialGradient(gx, gy, 20, gx, gy, 760);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(11, 8, 18, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }
  starfield(ctx, width, height);
  frame(ctx, width, height);

  // Верхний орнамент и название
  ctx.fillStyle = GOLD;
  crescent(ctx, cx - 160, 96, 22, 1);
  crescent(ctx, cx + 160, 96, 22, -1);
  star(ctx, cx, 96, 52);
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.ink;
  ctx.font = `italic 300 132px ${fonts.serif}`;
  ctx.fillText(spec.title, cx, 270);
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 330, 312);
  ctx.lineTo(cx + 330, 312);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  star(ctx, cx, 312, 14);
  ctx.fillStyle = "#E9D3A8";
  ctx.font = `italic 400 60px ${fonts.serif}`;
  ctx.fillText(spec.dateLabel, cx, 400);

  // Диск с кольцами
  const discY = 720;
  rings(ctx, cx, discY);
  disc(ctx, cx, discY, 270, texture, spec.illumination, spec.waxing);

  // Фаза
  pill(ctx, spec.phaseName, cx, 1050, 700, 104, `italic 400 66px ${fonts.serif}`);
  ctx.fillStyle = GOLD;
  crescent(ctx, cx - 300, 1102, 18, 1);
  crescent(ctx, cx + 300, 1102, 18, -1);

  // Знак
  medallion(ctx, cx, 1290, 120, sign);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `italic 400 72px ${fonts.serif}`;
  ctx.fillText(spec.signLine, cx, 1500);

  // Сутки
  pill(ctx, spec.dayLine, cx, 1550, 600, 96, `italic 400 56px ${fonts.serif}`);

  // Восход и заход
  const rowY = 1730;
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, rowY - 34);
  ctx.lineTo(cx, rowY + 34);
  ctx.stroke();
  horizon(ctx, 130, rowY - 6);
  horizon(ctx, cx + 80, rowY - 6);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `400 34px ${fonts.serif}`;
  ctx.textAlign = "left";
  ctx.fillText(`Восход Луны — ${spec.rise ?? "—"}`, 190, rowY + 6);
  ctx.fillText(`Заход Луны — ${spec.set ?? "—"}`, cx + 140, rowY + 6);
  ctx.textAlign = "center";

  // Подпись внизу
  ctx.fillStyle = GOLD;
  ctx.font = `600 28px ${fonts.sans}`;
  ctx.letterSpacing = "5px";
  ctx.fillText(spec.footer, cx, height - 92);
  ctx.letterSpacing = "0px";

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/png"));
}
