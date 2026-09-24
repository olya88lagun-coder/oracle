export { LOGIN_MARK } from "./login-mark";

// Номер счётчика и код Вебмастера видны в коде страницы любому, это не секреты.
// Пока значений нет (null), Метрика не загружается и метатег не выводится
export const METRIKA_ID: number | null = null;
export const YANDEX_VERIFICATION: string | null = null;

export const GOALS = ["login", "birth_date_saved"] as const;
export type Goal = (typeof GOALS)[number];

export const CONSENT_KEY = "oracle-cookie-consent";
export const COOKIE_SETTINGS_EVENT = "oracle:cookie-settings";
export type CookieChoice = "all" | "necessary";
type StorageLike = Pick<Storage, "getItem" | "setItem">;

// localStorage бывает недоступен (приватный режим, запрет сайта) — тогда баннер просто спросит снова
export function readChoice(storage: StorageLike): CookieChoice | null {
  try {
    const value = storage.getItem(CONSENT_KEY);
    return value === "all" || value === "necessary" ? value : null;
  } catch {
    return null;
  }
}

export function saveChoice(storage: StorageLike, choice: CookieChoice): void {
  try {
    storage.setItem(CONSENT_KEY, choice);
  } catch {
    // выбор действует до перезагрузки страницы
  }
}

// Параметры адреса не уходят в Метрику: в них может оказаться что-то личное
export function sanitizePath(path: string): string {
  const [pathname] = path.split(/[?#]/);
  return pathname || "/";
}

export function sanitizeReferrer(referrer: string, origin: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    return url.origin === origin ? `${origin}${sanitizePath(url.pathname)}` : url.origin;
  } catch {
    return undefined;
  }
}

type Ym = (id: number, method: string, ...args: unknown[]) => void;

export function reachGoal(goal: Goal, params?: Record<string, string | number>, counterId: number | null = METRIKA_ID): void {
  if (counterId === null) return;
  const ym = (globalThis as { window?: { ym?: Ym } }).window?.ym;
  ym?.(counterId, "reachGoal", goal, params);
}
