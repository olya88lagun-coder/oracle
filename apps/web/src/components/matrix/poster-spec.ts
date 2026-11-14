import type { Matrix } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import type { PosterSpec } from "@/lib/poster";
import { arcanumImage } from "@/lib/arcana-paths";
import { KEY_POINTS } from "@/lib/matrix-view";

// Картинка для сторис по матрице: три ключевых аркана и вопрос центра, без даты рождения. Один спек на результат и на готовый разбор
export function matrixPosterSpec(matrix: Matrix, eyebrow = "Моя матрица судьбы"): PosterSpec {
  return {
    eyebrow,
    title: "Личность · Центр · Задача",
    cards: KEY_POINTS.map(({ point, label }) => {
      const arcanum = arcanumByNumber(matrix[point]);
      return { image: arcanumImage(arcanum, "card"), caption: arcanum.name, note: label.toUpperCase() };
    }),
    textLabel: "Вопрос для себя",
    text: arcanumByNumber(matrix.E).question,
    footer: "ТВОЙ ОРАКУЛ · TVOY-ORAKUL.RU",
    fileName: "moya-matritsa",
  };
}
