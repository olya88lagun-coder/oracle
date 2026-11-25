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

export type YearMonth = { year: number; month: number };
export const monthIndex = ({ year, month }: YearMonth): number => year * 12 + month - 1;
export const monthFromIndex = (value: number): YearMonth => ({ year: Math.floor(value / 12), month: (value % 12) + 1 });

// Текущий месяц по Москве
export function currentMonth(now: Date): YearMonth {
  const [year, month] = moscowDate(now).split("-").map(Number) as [number, number];
  return { year, month };
}

// Предыдущий, текущий и 13 следующих месяцев по Москве: на столько месяцев есть страницы календаря
export function monthWindow(now: Date): YearMonth[] {
  const current = monthIndex(currentMonth(now));
  return Array.from({ length: 15 }, (_, offset) => monthFromIndex(current - 1 + offset));
}

export const isInWindow = (year: number, month: number, now: Date): boolean => monthWindow(now).some((item) => item.year === year && item.month === month);

export const currentMonthPath = (now: Date): string => lunarMonthPath(currentMonth(now).year, currentMonth(now).month);

// Страницы отдельных дней: «24-noyabrya-2026», слаг месяца в родительном падеже, день без нуля
export const MONTH_GENITIVE_SLUGS: readonly string[] = ["yanvarya", "fevralya", "marta", "aprelya", "maya", "iyunya", "iyulya", "avgusta", "sentyabrya", "oktyabrya", "noyabrya", "dekabrya"];

export type YearMonthDay = { year: number; month: number; day: number };

const lengthOfMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

export const lunarDayPath = (year: number, month: number, day: number): string => `${LUNAR_CALENDAR_PATH}/${day}-${MONTH_GENITIVE_SLUGS[month - 1]}-${year}`;

// Только точное «день-слаг-год»: нули, регистр, месяц в именительном падеже и несуществующие числа дают null
export function parseDaySlug(slug: string): YearMonthDay | null {
  const match = /^([1-9]|[12]\d|3[01])-([a-z]+)-(\d{4})$/.exec(slug);
  const month = match ? MONTH_GENITIVE_SLUGS.indexOf(match[2]!) + 1 : 0;
  if (!match || month === 0) return null;
  const year = Number(match[3]);
  const day = Number(match[1]);
  return day <= lengthOfMonth(year, month) ? { year, month, day } : null;
}

// Из даты вида YYYY-MM-DD (так записаны дни месяца в данных календаря) в адрес дня
export function lunarDayPathOfDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number) as [number, number, number];
  return lunarDayPath(year, month, day);
}

// Адреса всех дней окна месяцев
export const lunarDayPaths = (now: Date): string[] =>
  monthWindow(now).flatMap(({ year, month }) => Array.from({ length: lengthOfMonth(year, month) }, (_, index) => lunarDayPath(year, month, index + 1)));

// В sitemap — только ближайшие дни (±radius по Москве), и только те, что ещё в окне месяцев (иначе 404)
export const SITEMAP_DAY_RADIUS = 30;

export function lunarDayPathsForSitemap(now: Date, radiusDays = SITEMAP_DAY_RADIUS): string[] {
  const [year, month, day] = moscowDate(now).split("-").map(Number) as [number, number, number];
  const center = Date.UTC(year, month - 1, day);
  const paths: string[] = [];
  for (let offset = -radiusDays; offset <= radiusDays; offset++) {
    const at = new Date(center + offset * 86_400_000);
    const y = at.getUTCFullYear();
    const m = at.getUTCMonth() + 1;
    const d = at.getUTCDate();
    if (isInWindow(y, m, now)) paths.push(lunarDayPath(y, m, d));
  }
  return paths;
}
