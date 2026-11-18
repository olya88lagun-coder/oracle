import { THREAD_REPORT_PRODUCT } from "@oracle/core";
import type { IntentStorage } from "./matrix-save";

// Дата нити не попадает ни в адрес, ни в localStorage: «Войти и купить» кладёт её в sessionStorage этой вкладки
// только на время перехода во VK ID и обратно, а при чтении запись сразу стирается.
export const THREAD_PENDING_KEY = "oracle-thread-pending";

// Сервер не обрезает пробелы в дате, поэтому уходит ровно ISO-строка из калькулятора
export function threadPurchaseBody(p: { iso: string; email: string; free: boolean }) {
  return { product: THREAD_REPORT_PRODUCT, ...(p.free ? {} : { email: p.email }), birth: p.iso };
}

export function markThreadIntent(storage: IntentStorage | null, iso: string): void {
  try {
    storage?.setItem(THREAD_PENDING_KEY, iso);
  } catch {
    // без хранилища человек просто введёт дату ещё раз
  }
}

// Читает и всегда стирает запись; не похожее на дату — null (настоящая ли дата, проверит калькулятор)
export function takeThreadIntent(storage: IntentStorage | null): string | null {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(THREAD_PENDING_KEY) ?? null;
    storage?.removeItem(THREAD_PENDING_KEY);
  } catch {
    return null;
  }
  return raw !== null && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}
