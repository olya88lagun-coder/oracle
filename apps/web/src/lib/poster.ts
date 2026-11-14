// Картинка для сторис (1080×1920), которую браузер рисует сам: ни дата рождения, ни другие личные данные на неё не попадают,
// на сервер ничего не уходит. Размеры и цвета повторяют тёмную сцену сайта (docs/design/visual-direction.md)

export type PosterCard = { image: string; caption: string; note?: string };
export type PosterSpec = {
  eyebrow: string;
  title: string;
  cards: readonly PosterCard[]; // одна карта — крупно, три — в ряд
  text?: string; // вопрос или подсказка под картами
  textLabel?: string;
  footer: string;
  fileName: string;
};

export const POSTER_SIZE = { width: 1080, height: 1920 } as const;

type Measure = (text: string) => number;

// Перенос по словам: слово длиннее строки остаётся в своей строке целиком
export function wrapLines(measure: Measure, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const COLORS = { bg: "#0A090E", ink: "#F1E9DF", soft: "#B9AFA5", accent: "#CBA676", line: "rgba(203, 166, 118, 0.38)" } as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`image ${src}`));
    image.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// serif / sans — имена шрифтов страницы: холст берёт их из уже загруженных next/font
export async function renderPoster(spec: PosterSpec, fonts: { serif: string; sans: string }): Promise<Blob> {
  const { width, height } = POSTER_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  await document.fonts.ready;
  const images = await Promise.all(spec.cards.map((card) => loadImage(card.image)));

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width / 2, 760, 40, width / 2, 760, 900);
  glow.addColorStop(0, "rgba(203, 166, 118, 0.22)");
  glow.addColorStop(0.5, "rgba(185, 164, 232, 0.08)");
  glow.addColorStop(1, "rgba(10, 9, 14, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.accent;
  ctx.font = `600 30px ${fonts.sans}`;
  ctx.letterSpacing = "9px";
  ctx.fillText(spec.eyebrow.toUpperCase(), width / 2, 150);
  ctx.letterSpacing = "0px";
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 60, 190);
  ctx.lineTo(width / 2 + 60, 190);
  ctx.stroke();

  // Карты
  const single = spec.cards.length === 1;
  const cardWidth = single ? 520 : 290;
  const gap = 40;
  const total = cardWidth * spec.cards.length + gap * (spec.cards.length - 1);
  let x = (width - total) / 2;
  const top = single ? 270 : 480;
  let bottom = top;
  images.forEach((image, index) => {
    const cardHeight = Math.round((cardWidth * image.naturalHeight) / image.naturalWidth);
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 24;
    roundRect(ctx, x, top, cardWidth, cardHeight, 20);
    ctx.fillStyle = COLORS.bg;
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, top, cardWidth, cardHeight, 20);
    ctx.clip();
    ctx.drawImage(image, x, top, cardWidth, cardHeight);
    ctx.restore();
    roundRect(ctx, x, top, cardWidth, cardHeight, 20);
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 3;
    ctx.stroke();
    const card = spec.cards[index]!;
    if (!single) {
      ctx.fillStyle = COLORS.ink;
      ctx.font = `400 34px ${fonts.serif}`;
      ctx.fillText(card.caption, x + cardWidth / 2, top + cardHeight + 58);
      if (card.note) {
        ctx.fillStyle = COLORS.soft;
        ctx.font = `600 24px ${fonts.sans}`;
        ctx.fillText(card.note, x + cardWidth / 2, top + cardHeight + 98);
      }
    }
    bottom = Math.max(bottom, top + cardHeight + (single ? 0 : 110));
    x += cardWidth + gap;
  });

  // Название
  let y = bottom + (single ? 120 : 100);
  ctx.fillStyle = COLORS.ink;
  ctx.font = `300 84px ${fonts.serif}`;
  for (const line of wrapLines((t) => ctx.measureText(t).width, spec.title, width - 200)) {
    ctx.fillText(line, width / 2, y);
    y += 100;
  }

  // Вопрос или подсказка
  if (spec.text) {
    y += 20;
    if (spec.textLabel) {
      ctx.fillStyle = COLORS.accent;
      ctx.font = `600 26px ${fonts.sans}`;
      ctx.letterSpacing = "6px";
      ctx.fillText(spec.textLabel.toUpperCase(), width / 2, y);
      ctx.letterSpacing = "0px";
      y += 64;
    }
    ctx.fillStyle = COLORS.soft;
    ctx.font = `400 40px ${fonts.serif}`;
    for (const line of wrapLines((t) => ctx.measureText(t).width, spec.text, width - 240).slice(0, 6)) {
      ctx.fillText(line, width / 2, y);
      y += 58;
    }
  }

  ctx.fillStyle = COLORS.accent;
  ctx.font = `600 30px ${fonts.sans}`;
  ctx.letterSpacing = "4px";
  ctx.fillText(spec.footer, width / 2, height - 110);
  ctx.letterSpacing = "0px";

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/png"));
}
