import type { PhaseId } from "@oracle/core/moon/visual";
import type { SignId } from "@oracle/core/natal";

// «Коллекция Луны»: 12 гравюр знаков и 8 гравюр фаз. Гравюра открывается, когда вы зашли на страницу в день, где Луна в этом знаке или в этой фазе.
// Список открытых хранится только в браузере (localStorage), на сервер не уходит
export const SEEN_KEY = "moon:seen:v1";

export const COLLECTION_SIGNS: readonly SignId[] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
export const COLLECTION_PHASES: readonly PhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];

export type CollectionId = `sign:${SignId}` | `phase:${PhaseId}`;

export const COLLECTION_IDS: readonly CollectionId[] = [...COLLECTION_SIGNS.map((sign): CollectionId => `sign:${sign}`), ...COLLECTION_PHASES.map((phase): CollectionId => `phase:${phase}`)];

const VALID = new Set<string>(COLLECTION_IDS);

// Только известные гравюры, без повторов; всё остальное в хранилище игнорируем
export function parseSeen(raw: string | null): CollectionId[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((item): item is CollectionId => typeof item === "string" && VALID.has(item)))];
  } catch {
    return [];
  }
}

// Гравюры, которые открывает сегодняшний день: знак Луны и её фаза
export const openedBy = (sign: SignId, phase: PhaseId): CollectionId[] => [`sign:${sign}`, `phase:${phase}`];

// Добавляет гравюры к открытым; fresh — те, что открылись только что
export function unlock(seen: readonly CollectionId[], ids: readonly CollectionId[]): { seen: CollectionId[]; fresh: CollectionId[] } {
  const known = new Set(seen);
  const fresh = ids.filter((id, index) => !known.has(id) && ids.indexOf(id) === index);
  return { seen: [...seen, ...fresh], fresh };
}

// Ближайший день (не раньше сегодняшнего) в списке месяца, который откроет эту гравюру; null — в этом месяце такого дня нет
export function nextOpening(id: CollectionId, days: readonly { date: string; sign: SignId; phase: PhaseId }[], today: string): string | null {
  return days.find((day) => day.date >= today && openedBy(day.sign, day.phase).includes(id))?.date ?? null;
}

// Ближайший день строго после сегодняшнего, который откроет ещё не открытую гравюру; null — в списке такого дня нет
export function nextGravure(seen: readonly CollectionId[], days: readonly { date: string; sign: SignId; phase: PhaseId }[], today: string): { id: CollectionId; date: string } | null {
  for (const day of days) {
    if (day.date <= today) continue;
    const id = openedBy(day.sign, day.phase).find((candidate) => !seen.includes(candidate));
    if (id) return { id, date: day.date };
  }
  return null;
}

export function readSeen(): CollectionId[] {
  try {
    return parseSeen(window.localStorage.getItem(SEEN_KEY));
  } catch {
    return [];
  }
}

export function writeSeen(seen: readonly CollectionId[]): void {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // Хранилище закрыто: коллекция не запомнится, страница работает
  }
}
