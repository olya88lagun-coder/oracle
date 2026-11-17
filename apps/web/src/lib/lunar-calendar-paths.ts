// Адреса и разбор слагов месяцев. Безопасно для браузера: без расчётов Луны и без тяжёлых импортов
export const LUNAR_CALENDAR_PATH = "/lunnyy-kalendar";

export const MONTH_SLUGS: readonly string[] = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];

export const lunarMonthPath = (year: number, month: number): string => `${LUNAR_CALENDAR_PATH}/${MONTH_SLUGS[month - 1]}-${year}`;

// Только точное «слаг-год»: регистр, пробелы, лишние символы и неполный год дают null
export function parseMonthSlug(slug: string): { year: number; month: number } | null {
  const match = /^([a-z]+)-(\d{4})$/.exec(slug);
  const month = match ? MONTH_SLUGS.indexOf(match[1]!) + 1 : 0;
  return match && month > 0 ? { year: Number(match[2]), month } : null;
}

const moscowDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" });

// Календарный день по Москве вида YYYY-MM-DD
export const moscowDate = (now: Date): string => moscowDay.format(now);
