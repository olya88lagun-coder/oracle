import { currentMonthPath, LUNAR_CALENDAR_PATH } from "./lunar-calendar-paths";
import { MOON_PATH } from "./moon-paths";
import { DAYS_PATH, PHASES_PATH } from "./moon-year-paths";
import { WEEKDAY_PATH } from "./weekday-paths";

// Лунный раздел: пять вкладок ленты и правило, какие адреса ему принадлежат (для подсветки «Луны» в шапке)
export type MoonTabKey = "today" | "calendar" | "phases" | "days" | "weekday";

export const MOON_TAB_LABELS: Record<MoonTabKey, string> = { today: "Сегодня", calendar: "Календарь", phases: "Фазы", days: "Сутки", weekday: "Дни недели" };

export const moonTabs = (now: Date): { key: MoonTabKey; label: string; href: string }[] => [
  { key: "today", label: MOON_TAB_LABELS.today, href: MOON_PATH },
  { key: "calendar", label: MOON_TAB_LABELS.calendar, href: currentMonthPath(now) },
  { key: "phases", label: MOON_TAB_LABELS.phases, href: PHASES_PATH },
  { key: "days", label: MOON_TAB_LABELS.days, href: DAYS_PATH },
  { key: "weekday", label: MOON_TAB_LABELS.weekday, href: WEEKDAY_PATH },
];

const within = (pathname: string, base: string): boolean => pathname === base || pathname.startsWith(`${base}/`);

// Страницы событий года (/luna/novoluniya-2026 и т. п.) подсвечивают «Фазы»; адрес без своей вкладки даёт null
export function moonTabFor(pathname: string): MoonTabKey | null {
  if (pathname === MOON_PATH) return "today";
  if (within(pathname, LUNAR_CALENDAR_PATH)) return "calendar";
  if (within(pathname, DAYS_PATH)) return "days";
  if (within(pathname, "/luna")) return "phases";
  if (pathname === WEEKDAY_PATH) return "weekday";
  return null;
}

export const isMoonPath = (pathname: string): boolean => moonTabFor(pathname) !== null;
