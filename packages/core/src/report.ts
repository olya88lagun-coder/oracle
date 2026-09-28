// Главы платного разбора матрицы: порядок задаёт и оглавление, и порядок генерации
export const CHAPTER_IDS = ["core", "task", "love", "money", "family", "purpose", "scenario"] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];
