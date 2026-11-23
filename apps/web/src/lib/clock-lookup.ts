// Быстрый ввод времени на странице справочника: «11:11», «1111», «1.11» → «11:11»; не время → null
export function normalizeClockInput(raw: string): string | null {
  const match = /^(\d{1,2})\s*[:.\-]?\s*(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export const CLOCK_LOOKUP_LABEL = "Время на часах";
export const CLOCK_LOOKUP_ERROR = "Введите время в формате ЧЧ:ММ, например 11:11.";
export const CLOCK_LOOKUP_ORDINARY = (label: string): string => `${label} — обычное время: в справочнике только одинаковое и зеркальное. Запишите в дневнике, что вы заметили в тот момент: о чём думали и зачем посмотрели на часы.`;
