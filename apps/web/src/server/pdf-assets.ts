import { existsSync } from "node:fs";
import path from "node:path";
import type { Arcanum } from "@oracle/content";

// Файлы читаются с диска во время работы, а не собираются в бандл: turbopackIgnore не даёт трассировке захватить весь проект
// Шрифты и иллюстрации для PDF лежат в apps/web/assets/pdf. В разработке процесс запущен из apps/web,
// в образе — из корня standalone-сборки, поэтому ищем в обоих местах
const CANDIDATES = ["assets/pdf", "apps/web/assets/pdf"] as const;

export function pdfAssetsDir(cwd: string = process.cwd()): string {
  for (const candidate of CANDIDATES) {
    const dir = path.join(/*turbopackIgnore: true*/ cwd, candidate);
    if (existsSync(path.join(/*turbopackIgnore: true*/ dir, "fonts"))) return dir;
  }
  throw new Error("PDF assets directory not found");
}

export const PDF_FONT_FILES = {
  body: "Manrope_400Regular.ttf",
  bodyBold: "Manrope_600SemiBold.ttf",
  display: "NotoSerifDisplay_400Regular.ttf",
} as const;

export const pdfFontPath = (dir: string, font: keyof typeof PDF_FONT_FILES): string => path.join(/*turbopackIgnore: true*/ dir, "fonts", PDF_FONT_FILES[font]);

export const pdfArcanumImagePath = (dir: string, arcanum: Pick<Arcanum, "number" | "slug">): string =>
  path.join(/*turbopackIgnore: true*/ dir, "arcana", `${String(arcanum.number).padStart(2, "0")}-${arcanum.slug}.jpg`);
