import type { Arcanum } from "@oracle/content";
import { arcanumImage } from "./arcana-paths";

// Own-origin imagery and local fonts keep the canvas exportable without external services.
export async function createYearCard(arcanum: Arcanum): Promise<File> {
  await document.fonts.ready;
  const image = new Image();
  image.src = arcanumImage(arcanum);
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  const css = getComputedStyle(document.documentElement);
  const color = (name: string) => css.getPropertyValue(name).trim();
  const body = css.getPropertyValue("--font-body").trim();
  const display = css.getPropertyValue("--font-display").trim();
  ctx.fillStyle = color("--bg");
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.strokeStyle = color("--accent");
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, 1008, 1278);
  ctx.textAlign = "center";
  ctx.fillStyle = color("--accent");
  ctx.font = `600 26px ${body}`;
  ctx.fillText("МОЙ АРКАН 2027 ГОДА", 540, 100);
  ctx.drawImage(image, 240, 140, 600, 600);
  ctx.fillStyle = color("--ink");
  ctx.font = `400 62px ${display}`;
  ctx.fillText(`${arcanum.number}. ${arcanum.name}`, 540, 820, 920);
  ctx.fillStyle = color("--accent");
  ctx.font = `400 28px ${body}`;
  ctx.fillText(arcanum.keywords.join(" · "), 540, 882, 920);
  ctx.fillStyle = color("--ink-soft");
  ctx.font = `400 34px ${body}`;
  const lines: string[] = [];
  for (const word of arcanum.question.split(/\s+/)) {
    const last = lines.length - 1;
    const next = last < 0 ? word : `${lines[last]} ${word}`;
    if (last < 0 || ctx.measureText(next).width > 840) lines.push(word);
    else lines[last] = next;
  }
  lines.forEach((line, i) => ctx.fillText(line, 540, 972 + i * 48));
  ctx.fillStyle = color("--ink-soft");
  ctx.font = `400 24px ${body}`;
  ctx.fillText("Символ для размышления, не прогноз", 540, 1200);
  ctx.fillStyle = color("--accent");
  ctx.font = `600 28px ${body}`;
  ctx.fillText("Твой оракул · tvoy-orakul.ru/arkan-2027", 540, 1260);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("png_failed")), "image/png"));
  return new File([blob], `moy-arkan-2027-${arcanum.number}.png`, { type: "image/png" });
}

export function downloadYearCard(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
