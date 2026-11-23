// Картинки для PDF разборов: pdfkit не читает webp, поэтому гравюры и сцены из apps/web/public переводятся в jpeg
// в apps/web/assets/pdf (natal/<слаг>.jpg 360 px, natal/hero.jpg, natal/scenario.jpg, thread/hero.jpg). Запуск: node scripts/pdf-natal-images.mjs
// Узел «Северный узел в знаке» в PDF не нужен: у него нет главы
import { mkdirSync } from "node:fs";
import sharp from "sharp";
import { NATAL_PAGES } from "../packages/content/src/natal-manifest.ts";

const PUBLIC = "apps/web/public/";
const OUT = "apps/web/assets/pdf/";
const jpeg = (quality) => ({ quality, mozjpeg: true });

mkdirSync(`${OUT}natal`, { recursive: true });
mkdirSync(`${OUT}thread`, { recursive: true });

for (const page of NATAL_PAGES.filter((item) => item.kind !== "node")) {
  await sharp(`${PUBLIC}natal/${page.slug}.webp`).resize(360, 360).jpeg(jpeg(80)).toFile(`${OUT}natal/${page.slug}.jpg`);
}
await sharp(`${PUBLIC}images/natal/natal-hero-960.webp`).jpeg(jpeg(82)).toFile(`${OUT}natal/hero.jpg`);
await sharp(`${PUBLIC}images/natal/report-scenario.webp`).resize(960).jpeg(jpeg(82)).toFile(`${OUT}natal/scenario.jpg`);
await sharp(`${PUBLIC}images/numerology/thread-hero-960.webp`).jpeg(jpeg(82)).toFile(`${OUT}thread/hero.jpg`);
console.log("done");
