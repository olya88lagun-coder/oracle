// Материалы, по которым автописатель вправе писать. Название показывается читателю, файлы проверяются тестом
export const ARTICLE_BASIS = {
  arcana: { label: "Тексты арканов «Твоего оракула»", files: ["packages/content/arcana"] },
  positions: { label: "Описания позиций матрицы судьбы", files: ["packages/content/positions.md"] },
  "matrix-formulas": { label: "Формулы расчёта матрицы судьбы", files: ["packages/core/src/matrix.ts"] },
  "compat-texts": { label: "Тексты раздела «Совместимость»", files: ["packages/content/compat-arcana.md"] },
  "compat-formulas": { label: "Формулы расчёта совместимости", files: ["packages/core/src/compatibility.ts"] },
  "lila-cells": { label: "Тексты клеток Лилы", files: ["packages/content/lila-cells.md"] },
  "lila-rules": { label: "Правила и логика игры Лила", files: ["packages/core/src/lila.ts"] },
  "lila-guide": { label: "Как работает проводник в Лиле", files: ["packages/ai/src/lila-validate.ts", "packages/ai/src/lila-fallback.ts"] },
} as const;

export type ArticleBasisKey = keyof typeof ARTICLE_BASIS;

export const isBasisKey = (key: string): key is ArticleBasisKey => Object.hasOwn(ARTICLE_BASIS, key);
