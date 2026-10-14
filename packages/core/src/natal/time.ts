export type LocalDateTime = { year: number; month: number; day: number; hour: number; minute: number };

export type LocalToUtc =
  | { kind: "ok"; utc: Date }
  | { kind: "gap"; utc: Date }
  | { kind: "ambiguous"; utc: Date; alternative: Date };

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export function isValidZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

// Смещение зоны от UTC в минутах в момент ms (по базе часовых поясов, включая исторические правила)
export function utcOffsetMinutes(zone: string, ms: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - Math.floor(ms / 1000) * 1000) / MINUTE_MS;
}

// Местное время рождения → момент в UTC.
// gap: такого времени не было (часы перевели вперёд) — берём смещение до перевода, время «сдвигается» вперёд.
// ambiguous: время было дважды (часы перевели назад) — utc это первый раз, alternative — второй.
export function localToUtc(zone: string, local: LocalDateTime): LocalToUtc {
  const guess = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const offsets = [...new Set([utcOffsetMinutes(zone, guess - DAY_MS), utcOffsetMinutes(zone, guess + DAY_MS)])];
  const [first, second] = offsets
    .map((offset) => guess - offset * MINUTE_MS)
    .filter((candidate) => utcOffsetMinutes(zone, candidate) === (guess - candidate) / MINUTE_MS)
    .sort((a, b) => a - b);
  if (first === undefined) return { kind: "gap", utc: new Date(guess - Math.min(...offsets) * MINUTE_MS) };
  if (second === undefined) return { kind: "ok", utc: new Date(first) };
  return { kind: "ambiguous", utc: new Date(first), alternative: new Date(second) };
}
