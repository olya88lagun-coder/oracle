export { LOGIN_MARK } from "./login-mark";

// Номер счётчика и код Вебмастера видны в коде страницы любому, это не секреты.
// Пока значений нет (null), Метрика не загружается и метатег не выводится
export const METRIKA_ID: number | null = 113068094;
export const YANDEX_VERIFICATION: string | null = "9512ea7a80f720a4";

// План 1: вход и дата; план 2а: воронка матрицы судьбы; план 3а и 3б: Лила; план 5: совместимость; план 6: таро
export const GOALS = ["login", "birth_date_saved", "matrix_calculated", "matrix_save_click", "matrix_share", "arcana_to_calculator", "report_offer_view", "report_offer_click", "report_paid", "report_opened", "report_pdf_download", "lila_start", "lila_finish", "lila_save", "lila_offer_click", "lila_paid", "compat_calculated", "compat_share", "compat_pdf", "compat_offer_view", "compat_offer_click", "taro_draw", "taro_share"] as const;
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

// Метки рекламы нужны Метрике, чтобы связать визит с кампанией Директа: без них рекламный трафик выглядит как прямой заход.
// Пропускаем только их и только безобидные значения (буквы, цифры и несколько знаков, до 100 символов); остальные параметры отрезаются
const AD_PARAMS = ["yclid", "ysclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const SAFE_AD_VALUE = /^[\p{L}\p{N}_.\-~ +]{1,100}$/u;

export function adParams(search: string): string {
  const params = new URLSearchParams(search);
  const kept = new URLSearchParams();
  for (const key of AD_PARAMS) {
    const value = params.get(key);
    if (value && SAFE_AD_VALUE.test(value)) kept.set(key, value);
  }
  const text = kept.toString();
  return text ? `?${text}` : "";
}

// Адрес просмотра для Метрики: путь без параметров плюс метки рекламы
export const hitUrl = (origin: string, pathname: string, search: string): string => `${origin}${sanitizePath(pathname)}${adParams(search)}`;

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
