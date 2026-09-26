import { parseBirthDate, toIsoDate } from "@oracle/core";

// Дата, которую посетитель ввёл без входа, живёт только в его браузере — на сервер она уходит лишь при сохранении в портрет
export const BIRTH_DATE_KEY = "oracle-birth-date";

export type DateStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Обращение к localStorage может бросить (приватный режим, запрет сайта) — тогда калькулятор работает без памяти
export function browserStorage(): DateStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function clearStoredBirthDate(storage: DateStorage | null): void {
  try {
    storage?.removeItem(BIRTH_DATE_KEY);
  } catch {
    // нечего стирать
  }
}

export function readStoredBirthDate(storage: DateStorage | null, today: Date): string | null {
  try {
    const value = storage?.getItem(BIRTH_DATE_KEY) ?? null;
    if (value === null) return null;
    const date = parseBirthDate(value, today);
    if (!date) {
      clearStoredBirthDate(storage);
      return null;
    }
    return toIsoDate(date);
  } catch {
    return null;
  }
}

export function storeBirthDate(storage: DateStorage | null, iso: string): void {
  try {
    storage?.setItem(BIRTH_DATE_KEY, iso);
  } catch {
    // дата действует до перезагрузки страницы
  }
}

// Портрет главнее браузера: у вошедшего человека показываем сохранённую дату
export function pickBirthDate(p: { profile: string | null; stored: string | null }): { date: string | null; source: "profile" | "browser" | null } {
  if (p.profile) return { date: p.profile, source: "profile" };
  if (p.stored) return { date: p.stored, source: "browser" };
  return { date: null, source: null };
}
