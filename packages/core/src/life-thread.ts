import { parseBirthDate, type BirthDate } from "./birth-date";

// «Нить» (docs/superpowers/specs/2026-11-18-life-thread-design.md): личные годы нумерологии по всей жизни и четыре периода («вершины»).
// Символическая практика для самопознания, не прогноз.

const DAY_MS = 86_400_000;

const digitSum = (n: number): number => String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);

// Свёртка сложением цифр до 1–9, без мастер-чисел (как у личного года 2027)
export function foldToNine(n: number): number {
  let value = n;
  while (value > 9) value = digitSum(value);
  return value;
}

// Цифры дня и месяца рождения + цифры года, свёртка до 1–9
export function personalYearOf(birth: BirthDate, year: number): number {
  return foldToNine(digitSum(birth.day) + digitSum(birth.month) + digitSum(year));
}

export type ThreadYear = { readonly year: number; readonly value: number; readonly start: string; readonly end: string };
export type ThreadPeriod = { readonly index: 1 | 2 | 3 | 4; readonly value: number; readonly fromYear: number; readonly toYear: number | null };
export type LifeThread = {
  readonly birth: BirthDate;
  readonly lifePath: number;
  readonly years: readonly ThreadYear[];
  readonly currentYear: number;
  readonly periods: readonly ThreadPeriod[];
};

const isLeap = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

// Год начинается в день рождения; 29 февраля в невисокосный год — 1 марта
function startMs(birth: BirthDate, year: number): number {
  const moved = birth.month === 2 && birth.day === 29 && !isLeap(year);
  return Date.UTC(year, moved ? 2 : birth.month - 1, moved ? 1 : birth.day);
}

export type ThreadMonth = { readonly index: number; readonly value: number; readonly start: string; readonly end: string };

// Двенадцать личных месяцев года: число = год + календарный месяц начала; день начала — день рождения, в коротком месяце — его последний день
export function personalMonthsOf(birth: BirthDate, year: ThreadYear): readonly ThreadMonth[] {
  // Первый и тринадцатый старты берём от правила года, чтобы цепочка сходилась с границами лет (29 февраля → 1 марта)
  const starts = [startMs(birth, year.year)];
  // Год сдвинут на 1 марта: месяцы идут с 1-го числа, иначе 1–28 марта и 29 марта дали бы два одинаковых месяца подряд
  const moved = birth.month === 2 && birth.day === 29 && !isLeap(year.year);
  for (let k = 1; k < 12; k++) {
    const monthIndex = (moved ? 2 : birth.month - 1) + k;
    const target = year.year + Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    starts.push(Date.UTC(target, month, moved ? 1 : Math.min(birth.day, new Date(Date.UTC(target, month + 1, 0)).getUTCDate())));
  }
  starts.push(startMs(birth, year.year + 1));
  return starts.slice(0, 12).map((start, i) => ({
    index: i + 1,
    value: foldToNine(year.value + new Date(start).getUTCMonth() + 1),
    start: iso(start),
    end: iso((starts[i + 1] ?? start) - DAY_MS),
  }));
}

export function calculateLifeThread(value: string, today: Date): LifeThread | null {
  const birth = parseBirthDate(value, today);
  if (!birth) return null;
  const todayYear = today.getUTCFullYear();
  const todayMs = Date.UTC(todayYear, today.getUTCMonth(), today.getUTCDate());
  const lastYear = Math.max(birth.year + 90, todayYear + 9);
  const years: ThreadYear[] = [];
  for (let year = birth.year; year <= lastYear; year++) {
    years.push({ year, value: personalYearOf(birth, year), start: iso(startMs(birth, year)), end: iso(startMs(birth, year + 1) - DAY_MS) });
  }
  const currentYear = Math.max(birth.year, startMs(birth, todayYear) <= todayMs ? todayYear : todayYear - 1);

  const d = foldToNine(birth.day);
  const m = foldToNine(birth.month);
  const y = foldToNine(birth.year);
  const lifePath = foldToNine(digitSum(birth.day) + digitSum(birth.month) + digitSum(birth.year));
  const values = [foldToNine(m + d), foldToNine(d + y)];
  values.push(foldToNine((values[0] ?? 0) + (values[1] ?? 0)), foldToNine(m + y));
  const first = birth.year + 36 - lifePath;
  const bounds = [birth.year, first, first + 9, first + 18];
  const periods = values.map((periodValue, i): ThreadPeriod => ({ index: (i + 1) as 1 | 2 | 3 | 4, value: periodValue, fromYear: bounds[i] ?? birth.year, toYear: bounds[i + 1] ?? null }));
  return { birth, lifePath, years, currentYear, periods };
}
