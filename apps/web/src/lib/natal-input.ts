import type { City } from "@oracle/geo";
import { ERROR_CITY_REQUIRED, ERROR_DATE_EMPTY, ERROR_DATE_RANGE, ERROR_TIME_FORMAT } from "./natal-copy";

// Проверка формы калькулятора натальной карты. Чистые функции: «сегодня» передаётся параметром, ядро расчёта и база городов не подключаются
// (из @oracle/geo — только тип City, иначе база городов попала бы в бандл страницы).

export type RawNatalInput = { date: string; time: string; unknownTime: boolean; city: City | null };
export type NatalInput = { date: string /* ГГГГ-ММ-ДД */; time: string | null /* ЧЧ:ММ, null — время неизвестно */; city: City };
export type NatalField = "date" | "time" | "city";
export type NatalValidation = { ok: true; value: NatalInput } | { ok: false; field: NatalField; message: string };

const MIN_DATE = "1900-01-01";
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

// Дата существует в календаре (31 апреля и 29 февраля 1900 — нет)
function isRealDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Календарный день зрителя (по его местному календарю) в виде ГГГГ-ММ-ДД
function localDay(today: Date): string {
  const pad = (value: number, width: number) => String(value).padStart(width, "0");
  return `${pad(today.getFullYear(), 4)}-${pad(today.getMonth() + 1, 2)}-${pad(today.getDate(), 2)}`;
}

function dateMessage(date: string, today: Date): string | null {
  // Пустая, неразобранная и несуществующая дата (2023-02-30) — одно и то же сообщение
  if (!isRealDate(date)) return ERROR_DATE_EMPTY;
  // Даты ГГГГ-ММ-ДД сравниваются как строки
  return date < MIN_DATE || date > localDay(today) ? ERROR_DATE_RANGE : null;
}

function timeMessage(raw: RawNatalInput): string | null {
  if (raw.unknownTime) return null; // поле времени при неизвестном времени игнорируется
  return TIME_PATTERN.test(raw.time) ? null : ERROR_TIME_FORMAT;
}

// Сообщения всех полей сразу (состояние 5 макета показывает все ошибки); null — поле в порядке
export function validateAll(raw: RawNatalInput, today: Date): Record<NatalField, string | null> {
  return {
    date: dateMessage(raw.date, today),
    time: timeMessage(raw),
    city: raw.city ? null : ERROR_CITY_REQUIRED,
  };
}

// Первое неверное поле в порядке «дата, время, город» или готовые данные
export function validateNatalInput(raw: RawNatalInput, today: Date): NatalValidation {
  const messages = validateAll(raw, today);
  for (const field of ["date", "time", "city"] as const) {
    const message = messages[field];
    if (message !== null) return { ok: false, field, message };
  }
  if (!raw.city) return { ok: false, field: "city", message: ERROR_CITY_REQUIRED }; // сузить тип; сюда не попасть
  return { ok: true, value: { date: raw.date, time: raw.unknownTime ? null : raw.time, city: raw.city } };
}
