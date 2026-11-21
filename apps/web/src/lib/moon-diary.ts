// «Лунный дневник»: одна короткая запись на день. Хранится только в браузере (localStorage), на сервер не уходит и в адрес не попадает.
// Это заметки самому себе, а не оценки дней
export const DIARY_KEY = "moon:diary:v1";
export const DIARY_MAX_LENGTH = 280;
export const DIARY_MAX_ENTRIES = 800;

export type DiaryNotes = Record<string, string>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Читаем осторожно: в хранилище мог оказаться чужой или испорченный текст — берём только записи вида «дата → строка»
export function parseDiary(raw: string | null): DiaryNotes {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
    const notes: DiaryNotes = {};
    for (const [date, text] of Object.entries(value)) {
      if (ISO_DATE.test(date) && typeof text === "string" && text.trim()) notes[date] = text.slice(0, DIARY_MAX_LENGTH);
    }
    return notes;
  } catch {
    return {};
  }
}

// Новая запись заменяет старую; пустой текст удаляет запись; лишние старые записи отбрасываются
export function withNote(notes: DiaryNotes, date: string, text: string): DiaryNotes {
  if (!ISO_DATE.test(date)) return notes;
  const next = { ...notes };
  const clean = text.trim().slice(0, DIARY_MAX_LENGTH);
  if (clean) next[date] = clean;
  else delete next[date];
  const dates = Object.keys(next).sort();
  for (const old of dates.slice(0, Math.max(0, dates.length - DIARY_MAX_ENTRIES))) delete next[old];
  return next;
}

const dayBefore = (iso: string): string => new Date(Date.parse(`${iso}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

// Записей в месяце (monthPrefix — «2026-11») и дней подряд до сегодняшнего: если сегодня записи ещё нет, ряд считается со вчерашнего дня
export function diaryStats(notes: DiaryNotes, today: string, monthPrefix: string): { inMonth: number; streak: number } {
  const inMonth = Object.keys(notes).filter((date) => date.startsWith(monthPrefix)).length;
  // Без настоящей сегодняшней даты (на сервере её ещё нет) ряд не считаем
  if (!ISO_DATE.test(today) || Number.isNaN(Date.parse(`${today}T00:00:00Z`))) return { inMonth, streak: 0 };
  let streak = 0;
  for (let day = notes[today] ? today : dayBefore(today); notes[day]; day = dayBefore(day)) streak++;
  return { inMonth, streak };
}

export function readDiary(): DiaryNotes {
  try {
    return parseDiary(window.localStorage.getItem(DIARY_KEY));
  } catch {
    return {};
  }
}

export function writeDiary(notes: DiaryNotes): void {
  try {
    window.localStorage.setItem(DIARY_KEY, JSON.stringify(notes));
  } catch {
    // Хранилище закрыто или переполнено: дневник просто не сохранится, страница продолжает работать
  }
}
