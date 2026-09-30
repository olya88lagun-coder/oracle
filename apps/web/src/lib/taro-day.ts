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

export function writeDayCard(storage: StorageLike, now: Date, card: string): void {
  try {
    storage?.setItem(TARO_DAY_KEY, JSON.stringify({ day: moscowDayKey(now), card }));
  } catch {
    // Хранилище недоступно — карта просто не запомнится
  }
}
