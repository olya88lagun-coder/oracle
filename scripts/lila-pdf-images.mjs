// Картинки клеток Лилы для PDF: pdfkit не читает webp, поэтому из apps/web/public/lila/NN-slug.webp (960 px)
// делаем jpg 560 px в apps/web/assets/pdf/lila. Запуск: node scripts/lila-pdf-images.mjs
import { mkdirSync, readdirSync } from "node:fs";
import sharp from "sharp";

const SRC = "apps/web/public/lila";
const OUT = "apps/web/assets/pdf/lila";
const SIZE = 560;

mkdirSync(OUT, { recursive: true });
const files = readdirSync(SRC).filter((name) => /^\d\d-[a-z-]+\.webp$/.test(name) && !/-(160|480)\.webp$/.test(name));
for (const name of files) {
  await sharp(`${SRC}/${name}`).resize(SIZE, SIZE, { fit: "cover" }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${OUT}/${name.replace(".webp", ".jpg")}`);
}
console.log(`${files.length} files`);
