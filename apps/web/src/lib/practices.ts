export type Practice = { slug: "matrix" | "lila" | "tarot" | "natal"; title: string; summary: string };

// Порядок — порядок запуска из спецификации (раздел 6)
export const PRACTICES: readonly Practice[] = [
  { slug: "matrix", title: "Матрица судьбы", summary: "22 аркана по дате рождения: сильные стороны, повторяющиеся сценарии и точки роста." },
  { slug: "lila", title: "Лила", summary: "Игра с намерением на поле из 72 клеток — повод посмотреть на свой вопрос по-новому." },
  { slug: "tarot", title: "Таро", summary: "Расклад на вопрос и карта дня: символы как зеркало, а не приговор." },
  { slug: "natal", title: "Натальная карта", summary: "Настоящий расчёт по дате, времени и месту рождения." },
];
