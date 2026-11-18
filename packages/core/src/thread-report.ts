// Главы платного разбора «нити»: типы и названия лежат в core, чтобы @oracle/db мог их использовать, не завися от @oracle/content.
export const THREAD_CHAPTER_IDS = ["now", "years", "past", "periods", "rhythm", "rules"] as const;
export type ThreadChapterId = (typeof THREAD_CHAPTER_IDS)[number];

export const THREAD_CHAPTER_TITLES: Readonly<Record<ThreadChapterId, string>> = {
  now: "Где вы сейчас",
  years: "Семь лет вперёд",
  past: "Прошлые годы",
  periods: "Четыре периода жизни",
  rhythm: "Ваш ритм",
  rules: "Три правила и вопрос на год",
};

export type ThreadBlock = { heading?: string; paragraphs: string[] };
// Разбор собирается без ИИ из готовых текстов, поэтому источник один
export type ThreadChapter = { id: ThreadChapterId; source: "fallback"; blocks: ThreadBlock[] };
