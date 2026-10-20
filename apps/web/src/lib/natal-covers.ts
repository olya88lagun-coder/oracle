// Обложки страниц значений («Солнце в Рыбах» и др.): гравюры 640×640 в apps/web/public/natal/<слаг>.webp.
// Список явный: у страницы без обложки в шапке остаётся SVG-эмблема (глиф тела и знака). Новую обложку добавляют вместе с файлом;
// тест проверяет, что у каждого слага есть файл нужного размера и что лишних файлов нет
export const NATAL_COVER_SIZE = 640;

export const NATAL_COVER_SLUGS: ReadonlySet<string> = new Set([
  "solntse-v-rybah",
  "luna-v-rybah",
  "ascendent-v-rybah",
  "merkuriy-v-rybah",
  "venera-v-rybah",
  "mars-v-rybah",
  "yupiter-v-rybah",
  "saturn-v-rybah",
  "uran-v-rybah",
  "neptun-v-rybah",
  "pluton-v-rybah",
]);

export const natalCoverPath = (slug: string): string | null => (NATAL_COVER_SLUGS.has(slug) ? `/natal/${slug}.webp` : null);
