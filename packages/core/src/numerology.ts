import { parseBirthDate } from "./birth-date";

// Одобрено владелицей 08.11.2026 (docs/superpowers/specs/2026-11-08-numerology-design.md).
// Символическая практика для самопознания, не прогноз.

export const MASTER_NUMBERS = [11, 22, 33] as const;
export const FATE_NUMBERS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

const isMaster = (n: number): boolean => (MASTER_NUMBERS as readonly number[]).includes(n);
const digitSum = (n: number): number => String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);

export type FateNumber = { readonly sum: number; readonly steps: readonly number[]; readonly value: number };

// Сумма всех цифр ДДММГГГГ; сворачиваем, пока не 1–9, но останавливаемся на 11, 22, 33 на любом шаге
export function calculateFateNumber(iso: string, today: Date): FateNumber | null {
  const date = parseBirthDate(iso, today);
  if (!date) return null;
  const sum = digitSum(date.day) + digitSum(date.month) + digitSum(date.year);
  const steps = [sum];
  let value = sum;
  while (value > 9 && !isMaster(value)) {
    value = digitSum(value);
    steps.push(value);
  }
  return { sum, steps, value };
}

export const PERSONAL_YEAR = 2027;
export type PersonalYear = { readonly year: 2027; readonly sum: number; readonly value: number };

// Цифры дня и месяца рождения + 2 + 0 + 2 + 7, свёртка до 1–9 без мастер-чисел: страниц личного года девять
export function calculatePersonalYear(iso: string, today: Date): PersonalYear | null {
  const date = parseBirthDate(iso, today);
  if (!date) return null;
  const sum = digitSum(date.day) + digitSum(date.month) + digitSum(PERSONAL_YEAR);
  let value = sum;
  while (value > 9) value = digitSum(value);
  return { year: PERSONAL_YEAR, sum, value };
}

export type ClockKind = "repeat" | "mirror" | "both";
export type ClockTime = { readonly slug: string; readonly label: string; readonly hours: number; readonly minutes: number; readonly kind: ClockKind };

const pad = (n: number): string => String(n).padStart(2, "0");

// Часы равны минутам (00:00…23:23, 24 шт.) и зеркальные (минуты — часы наоборот: 12:21; 16 шт., у 06–09 и 16–19 таких минут нет); 00:00, 11:11, 22:22 в обеих группах — итого 37
export const CLOCK_TIMES: readonly ClockTime[] = (() => {
  const byMinute = new Map<number, ClockTime>();
  const add = (hours: number, minutes: number, kind: "repeat" | "mirror") => {
    const at = hours * 60 + minutes;
    const existing = byMinute.get(at);
    const slug = `${pad(hours)}-${pad(minutes)}`;
    byMinute.set(at, { slug, label: `${pad(hours)}:${pad(minutes)}`, hours, minutes, kind: existing && existing.kind !== kind ? "both" : kind });
  };
  for (let h = 0; h < 24; h++) {
    add(h, h, "repeat");
    const mirrored = Number(pad(h).split("").reverse().join(""));
    if (mirrored < 60) add(h, mirrored, "mirror"); // 06→60, 17→71 и т. п. — таких минут нет
  }
  return [...byMinute.entries()].sort(([a], [b]) => a - b).map(([, time]) => time);
})();

export function clockBySlug(slug: string): ClockTime | undefined {
  return CLOCK_TIMES.find((time) => time.slug === slug);
}
