export const TARO_DAY_KEY = "taro:day:v1";
type StorageLike = Pick<Storage, "getItem" | "setItem"> | null;

// Сутки считаются по Москве: смена карты — в полночь по московскому времени
export const moscowDayKey = (now: Date): string => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Moscow" }).format(now);

const randomUint32 = (): number => crypto.getRandomValues(new Uint32Array(1))[0]!;

// Равномерный выбор: значения из «хвоста» диапазона, который не делится на count, отбрасываются
export function pickCardIndex(count: number, random: () => number = randomUint32): number {
  const limit = Math.floor(0x1_0000_0000 / count) * count;
  let value = random();
  while (value >= limit) value = random();
  return value % count;
}

export function readDayCard(storage: StorageLike, now: Date): string | null {
  try {
    const stored = JSON.parse(storage?.getItem(TARO_DAY_KEY) ?? "null") as { day?: unknown; card?: unknown } | null;
    return stored && stored.day === moscowDayKey(now) && typeof stored.card === "string" ? stored.card : null;
  } catch {
    return null;
  }
}

// Сколько осталось до смены карты дня: полночь по Москве (UTC+3 круглый год, перехода на летнее время нет)
const MSK_OFFSET_MS = 3 * 3_600_000;
const DAY_MS = 86_400_000;
export const msUntilNextMoscowDay = (now: Date): number => DAY_MS - ((now.getTime() + MSK_OFFSET_MS) % DAY_MS);

export function formatUntilNextCard(ms: number): string {
  const total = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} мин`;
  return minutes === 0 ? `${hours} ч` : `${hours} ч ${minutes} мин`;
}

// Колода встреченных карт: только слаги, в браузере; на сервер не уходит
export const TARO_SEEN_KEY = "taro:seen:v1";

export function readSeenCards(storage: StorageLike): string[] {
  try {
    const stored: unknown = JSON.parse(storage?.getItem(TARO_SEEN_KEY) ?? "null");
    return Array.isArray(stored) ? stored.filter((slug): slug is string => typeof slug === "string") : [];
  } catch {
    return [];
  }
}

// Добавляет карту и возвращает обновлённый список; повторная запись той же карты ничего не меняет
export function addSeenCard(storage: StorageLike, card: string): string[] {
  const seen = readSeenCards(storage);
  if (seen.includes(card)) return seen;
  const next = [...seen, card];
  try {
    storage?.setItem(TARO_SEEN_KEY, JSON.stringify(next));
  } catch {
    // Хранилище недоступно — колода просто не запомнится
  }
  return next;
}

export function writeDayCard(storage: StorageLike, now: Date, card: string): void {
  try {
    storage?.setItem(TARO_DAY_KEY, JSON.stringify({ day: moscowDayKey(now), card }));
  } catch {
    // Хранилище недоступно — карта просто не запомнится
  }
}
