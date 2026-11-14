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

function paintFrame(ctx: CanvasRenderingContext2D, eyebrow: string, fonts: { serif: string; sans: string }) {
  const { width, height } = POSTER_SIZE;
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
  ctx.fillText(eyebrow.toUpperCase(), width / 2, 150);
  ctx.letterSpacing = "0px";
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 60, 190);
  ctx.lineTo(width / 2 + 60, 190);
  ctx.stroke();
}

function paintFooter(ctx: CanvasRenderingContext2D, footer: string, fonts: { serif: string; sans: string }) {
  const { width, height } = POSTER_SIZE;
  ctx.fillStyle = COLORS.accent;
  ctx.font = `600 30px ${fonts.sans}`;
  ctx.letterSpacing = "4px";
  ctx.textAlign = "center";
  ctx.fillText(footer, width / 2, height - 110);
  ctx.letterSpacing = "0px";
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

  paintFrame(ctx, spec.eyebrow, fonts);

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

  paintFooter(ctx, spec.footer, fonts);

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/png"));
}

// «Мой путь» в Лиле: поле, золотая нить по пройденным клеткам и кольцо на последней. Текст намерения на картинку не попадает — оно личное
export type PathPosterSpec = { trail: readonly { x: number; y: number }[]; board: { image: string; width: number; height: number }; moves: number; opened: number; total: number; footer: string; fileName: string };

export async function renderPathPoster(spec: PathPosterSpec, fonts: { serif: string; sans: string }): Promise<Blob> {
  const { width, height } = POSTER_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  await document.fonts.ready;
  const board = await loadImage(spec.board.image);

  paintFrame(ctx, "Моя Лила", fonts);

  const boardWidth = 960;
  const scale = boardWidth / spec.board.width;
  const boardHeight = Math.round(spec.board.height * scale);
  const left = (width - boardWidth) / 2;
  const top = 300;
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  roundRect(ctx, left, top, boardWidth, boardHeight, 18);
  ctx.fillStyle = COLORS.bg;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, left, top, boardWidth, boardHeight, 18);
  ctx.clip();
  ctx.drawImage(board, left, top, boardWidth, boardHeight);
  ctx.restore();

  const at = (point: { x: number; y: number }) => ({ x: left + point.x * scale, y: top + point.y * scale });
  if (spec.trail.length > 1) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    spec.trail.forEach((point, index) => {
      const { x, y } = at(point);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "rgba(203, 166, 118, 0.35)";
    ctx.lineWidth = 16;
    ctx.stroke();
    ctx.strokeStyle = "#CBA676";
    ctx.lineWidth = 5;
    ctx.shadowColor = "rgba(203, 166, 118, 0.8)";
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();
  }
  const last = spec.trail.at(-1);
  if (last) {
    const { x, y } = at(last);
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.strokeStyle = "#B9A4E8";
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.ink;
  ctx.font = `300 84px ${fonts.serif}`;
  let y = top + boardHeight + 140;
  for (const line of wrapLines((t) => ctx.measureText(t).width, "Мой путь по 72 клеткам", width - 200)) {
    ctx.fillText(line, width / 2, y);
    y += 100;
  }
  ctx.fillStyle = COLORS.soft;
  ctx.font = `400 40px ${fonts.serif}`;
  ctx.fillText(`Ходов: ${spec.moves} · открыто клеток: ${spec.opened} из ${spec.total}`, width / 2, y + 20);

  paintFooter(ctx, spec.footer, fonts);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/png"));
}
