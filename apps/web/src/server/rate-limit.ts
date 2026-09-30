export type RateLimiter = { allow(key: string): boolean };

const MAX_TRACKED_KEYS = 10_000;
const MINUTE_MS = 60_000;
const PROFILE_SAVES_PER_MINUTE = 20;
const PURCHASES_PER_MINUTE = 10;
const REPORT_PDFS_PER_MINUTE = 10;
const COMPAT_PDFS_PER_MINUTE = 6;
const LILA_ACTIONS_PER_MINUTE = 60;
const LILA_POLLS_PER_MINUTE = 120;

// Память процесса: на одном контейнере web этого достаточно, чтобы не дать засыпать базу запросами
export function createRateLimiter(p: { limit: number; windowMs: number; now?: () => number }): RateLimiter {
  const now = p.now ?? Date.now;
  const windows = new Map<string, { startedAt: number; count: number }>();
  return {
    allow(key) {
      const current = now();
      if (windows.size > MAX_TRACKED_KEYS) windows.clear();
      const window = windows.get(key);
      if (!window || current - window.startedAt >= p.windowMs) {
        windows.set(key, { startedAt: current, count: 1 });
        return true;
      }
      if (window.count >= p.limit) return false;
      windows.set(key, { startedAt: window.startedAt, count: window.count + 1 });
      return true;
    },
  };
}

export const profileLimiter = createRateLimiter({ limit: PROFILE_SAVES_PER_MINUTE, windowMs: MINUTE_MS });
// Каждая попытка покупки создаёт платёж в ЮKassa — лимит строже, чем у сохранения даты
export const purchaseLimiter = createRateLimiter({ limit: PURCHASES_PER_MINUTE, windowMs: MINUTE_MS });
// Сборка PDF занимает процессор и память контейнера web, поэтому скачивания ограничены по пользователю
export const reportPdfLimiter = createRateLimiter({ limit: REPORT_PDFS_PER_MINUTE, windowMs: MINUTE_MS });
// PDF совместимости доступен без входа, поэтому ключ — адрес клиента; сборка занимает процессор, лимит строгий
export const compatPdfLimiter = createRateLimiter({ limit: COMPAT_PDFS_PER_MINUTE, windowMs: MINUTE_MS });

// Броски, записи и перенос партии: ход — короткая операция, но перебор должен упираться в лимит
export const lilaLimiter = createRateLimiter({ limit: LILA_ACTIONS_PER_MINUTE, windowMs: MINUTE_MS });

// Опрос итога платной партии: вкладка спрашивает раз в 3 секунды (20 в минуту), запас — на несколько вкладок
export const lilaPollLimiter = createRateLimiter({ limit: LILA_POLLS_PER_MINUTE, windowMs: MINUTE_MS });

// Caddy заменяет X-Forwarded-For, пришедший от клиента, поэтому первый адрес — настоящий
export function clientKeyFromHeaders(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
