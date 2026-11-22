import { COLORS, loadImage, POSTER_SIZE, roundRect, wrapLines } from "./poster";
import { frame, star, starfield } from "./poster-moon-render";
import type { WeekdayPosterSpec } from "./poster-weekday";

type Fonts = { serif: string; sans: string };

const GOLD = "#CBA676";
const GOLD_SOFT = "rgba(203, 166, 118, 0.55)";

// Строки по ширине, но не больше maxLines: хвост уходит в многоточие
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines = wrapLines((value) => ctx.measureText(value).width, text, maxWidth);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1]!.replace(/[\s.,;:!?—-]+$/, "")}…`;
  return kept;
}

export async function renderWeekdayPoster(spec: WeekdayPosterSpec, fonts: Fonts): Promise<Blob> {
  const { width, height } = POSTER_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  await document.fonts.ready;
  const planet = await loadImage(spec.image);
  const cx = width / 2;

  ctx.fillStyle = "#0B0812";
  ctx.fillRect(0, 0, width, height);
  for (const [gx, gy, color] of [[cx, 760, "rgba(203, 166, 118, 0.20)"], [cx, 1560, "rgba(110, 70, 150, 0.20)"]] as const) {
    const glow = ctx.createRadialGradient(gx, gy, 20, gx, gy, 760);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(11, 8, 18, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }
  starfield(ctx, width, height);
  frame(ctx, width, height);

  // Название дня и планета
  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = `600 30px ${fonts.sans}`;
  ctx.letterSpacing = "8px";
  ctx.fillText("ПЛАНЕТА ДНЯ", cx, 150);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = COLORS.ink;
  ctx.font = `italic 300 140px ${fonts.serif}`;
  ctx.fillText(spec.day, cx, 330);
  ctx.fillStyle = "#E9D3A8";
  ctx.font = `italic 400 64px ${fonts.serif}`;
  ctx.fillText(spec.subtitle, cx, 420);
  ctx.strokeStyle = GOLD_SOFT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 300, 468);
  ctx.lineTo(cx + 300, 468);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  star(ctx, cx, 468, 14);

  // Планета на тёмном небе
  ctx.drawImage(planet, cx - 330, 520, 660, 660);

  // Образ
  ctx.fillStyle = COLORS.soft;
  ctx.font = `400 44px ${fonts.serif}`;
  fit(ctx, spec.archetype, 820, 2).forEach((line, index) => ctx.fillText(line, cx, 1250 + index * 58));

  // Вопрос в рамке
  const top = 1390;
  const boxHeight = 380;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  roundRect(ctx, 110, top, width - 220, boxHeight, 28);
  ctx.stroke();
  ctx.fillStyle = "rgba(203, 166, 118, 0.06)";
  roundRect(ctx, 110, top, width - 220, boxHeight, 28);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.font = `600 28px ${fonts.sans}`;
  ctx.letterSpacing = "6px";
  ctx.fillText(spec.questionLabel.toUpperCase(), cx, top + 62);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = COLORS.ink;
  ctx.font = `italic 400 50px ${fonts.serif}`;
  fit(ctx, spec.question, width - 340, 5).forEach((line, index) => ctx.fillText(line, cx, top + 140 + index * 62));

  ctx.fillStyle = GOLD;
  ctx.font = `600 28px ${fonts.sans}`;
  ctx.letterSpacing = "5px";
  ctx.fillText(spec.footer, cx, height - 92);
  ctx.letterSpacing = "0px";

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/png"));
}
