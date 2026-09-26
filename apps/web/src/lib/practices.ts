import { MATRIX_PATH } from "./arcana-paths";

export type Practice = { slug: "matrix" | "lila" | "tarot" | "natal"; title: string; summary: string; href: string | null };

// Порядок — порядок запуска из спецификации (раздел 6); href есть только у открытых практик
export const PRACTICES: readonly Practice[] = [
  { slug: "matrix", title: "Матрица судьбы", summary: "22 аркана по дате рождения: сильные стороны, повторяющиеся сценарии и точки роста.", href: MATRIX_PATH },
  { slug: "lila", title: "Лила", summary: "Игра с намерением на поле из 72 клеток — повод посмотреть на свой вопрос по-новому.", href: null },
  { slug: "tarot", title: "Таро", summary: "Расклад на вопрос и карта дня: символы как зеркало, а не приговор.", href: null },
  { slug: "natal", title: "Натальная карта", summary: "Настоящий расчёт по дате, времени и месту рождения.", href: null },
];
