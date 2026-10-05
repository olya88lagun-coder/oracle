export { LOGIN_MARK } from "./login-mark";

// Номер счётчика и код Вебмастера видны в коде страницы любому, это не секреты.
// Пока значений нет (null), Метрика не загружается и метатег не выводится
export const METRIKA_ID: number | null = 113068094;
export const YANDEX_VERIFICATION: string | null = "9512ea7a80f720a4";

// План 1: вход и дата; план 2а: воронка матрицы судьбы; план 3а и 3б: Лила; план 5: совместимость; план 6: таро;
// lila_offer_view, lila_login_click, checkout_redirect, checkout_error — аудит 4 октября: потери между предложением, входом и оплатой
export const GOALS = ["login", "birth_date_saved", "matrix_calculated", "matrix_save_click", "matrix_share", "arcana_to_calculator", "report_offer_view", "report_offer_click", "report_paid", "report_opened", "report_pdf_download", "lila_start", "lila_finish", "lila_save", "lila_offer_click", "lila_paid", "compat_calculated", "compat_share", "compat_pdf", "compat_offer_view", "compat_offer_click", "taro_draw", "taro_share", "lila_offer_view", "lila_login_click", "checkout_redirect", "checkout_error"] as const;
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

// true — цель поставлена в очередь счётчика. Без согласия на cookie счётчика нет, и цель честно не уходит
export function reachGoal(goal: Goal, params?: Record<string, string | number>, counterId: number | null = METRIKA_ID): boolean {
  if (counterId === null) return false;
  const ym = (globalThis as { window?: { ym?: Ym } }).window?.ym;
  if (!ym) return false;
  ym(counterId, "reachGoal", goal, params);
  return true;
}

const NAVIGATE_FALLBACK_MS = 300;

// Переход на оплату: Метрика отправляет цель асинхронно, и мгновенный уход со страницы мог её отменить.
// Уходим по сигналу счётчика «цель отправлена» или через 300 мс, что наступит раньше; без счётчика (нет согласия) уходим сразу
export function reachGoalThenNavigate(goal: Goal, params: Record<string, string | number>, url: string, navigate: (url: string) => void, counterId: number | null = METRIKA_ID): void {
  const ym = (globalThis as { window?: { ym?: Ym } }).window?.ym;
  if (counterId === null || !ym) return navigate(url);
  let gone = false;
  const go = (): void => {
    if (gone) return;
    gone = true;
    navigate(url);
  };
  ym(counterId, "reachGoal", goal, params, go);
  setTimeout(go, NAVIGATE_FALLBACK_MS);
}

// Параметры платёжных целей — закрытый список: продукт и безопасный код ошибки. Ни дат, ни почты, ни намерений, ни номеров покупок
export type CheckoutProduct = "matrix" | "compat" | "lila";
export const checkoutParams = (product: CheckoutProduct, error?: string): Record<string, string> => (error ? { product, error } : { product });

const READY_RETRY_MS = 500;
const READY_RETRY_LIMIT = 20;
const pendingOnce = new Set<string>();

function safeStorage(): StorageLike | null {
  try {
    return globalThis.window?.localStorage ?? null;
  } catch {
    return null;
  }
}

// Цель «один раз на покупку в этом браузере». Отметку ставим только когда счётчик принял цель: если он ещё не создан
// (страница открылась раньше баннера и загрузки Метрики), ждём его до 10 секунд, а не теряем покупку навсегда.
// Без согласия на cookie счётчика нет вовсе — тогда отметки нет. Цель уйдёт, только если человек согласится в течение этих 10 секунд
// или откроет страницу снова
export function reachGoalOnce(goal: Goal, key: string, counterId: number | null = METRIKA_ID, storage: StorageLike | null = safeStorage()): void {
  const done = (): boolean => {
    try {
      return storage?.getItem(key) != null;
    } catch {
      return false;
    }
  };
  if (counterId === null || done() || pendingOnce.has(key)) return;
  pendingOnce.add(key);
  const attempt = (triesLeft: number): void => {
    if (done()) return void pendingOnce.delete(key);
    if (reachGoal(goal, undefined, counterId)) {
      try {
        storage?.setItem(key, "1");
      } catch {
        // Хранилище недоступно (приватный режим) — цель может засчитаться повторно, это не страшно
      }
      return;
    }
    if (triesLeft > 0) setTimeout(() => attempt(triesLeft - 1), READY_RETRY_MS);
    else pendingOnce.delete(key);
  };
  attempt(READY_RETRY_LIMIT);
}
