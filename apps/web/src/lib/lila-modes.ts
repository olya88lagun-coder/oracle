import { LILA_CONCLUSION_CHAPTERS, LILA_CONCLUSION_TITLES } from "@oracle/core";

// Таблица «Что вы получите» на /lila: два режима игры по строкам. Только то, что сайт делает на самом деле
// (экран завершённой партии: история и картинка «Мой путь» есть у обоих; итог и PDF — только у партии с проводником)
export type ModeRow = { readonly what: string; readonly free: string; readonly guided: string };

const CHAPTERS = LILA_CONCLUSION_CHAPTERS.map((id) => `«${LILA_CONCLUSION_TITLES[id]}»`).join(", ");

export const LILA_MODE_ROWS: readonly ModeRow[] = [
  { what: "Поле, кубик, тексты 72 клеток и вопросы для размышления", free: "Да", guided: "Да" },
  { what: "Ваши записи к ходам", free: "Да", guided: "Да" },
  { what: "История партии и картинка «Мой путь»", free: "Да", guided: "Да" },
  { what: "Начать без регистрации", free: "Да, гостевая партия хранится в браузере", guided: "Нет: нужен вход через VK ID и оплата до начала" },
  { what: "Абзацы проводника по ходам", free: "Нет", guided: "Да, их пишет ИИ" },
  { what: "Итог партии", free: "Нет", guided: `Да: ${CHAPTERS}` },
  { what: "PDF с итогом", free: "Нет", guided: "Да" },
];
