import { LILA_INTENTION_MAX_CHARS } from "@oracle/core";
import { browserStorage, type DateStorage } from "./birth-date-storage";
import { LILA_THEMES } from "./lila-themes";

export const LILA_DRAFT_KEY = "lila:draft:v1";
export const LILA_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
export type LilaDraft = { text: string; theme: string };

export function clearLilaDraft(storage: DateStorage | null = browserStorage()): void {
  try { storage?.removeItem(LILA_DRAFT_KEY); } catch { /* Хранилище может быть запрещено. */ }
}

export function readLilaDraft(storage: DateStorage | null = browserStorage(), now = Date.now()): LilaDraft | null {
  try {
    const raw = storage?.getItem(LILA_DRAFT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<LilaDraft> & { expiresAt?: number };
    const validTheme = value.theme === "" || LILA_THEMES.some((_, index) => value.theme === String(index));
    if (typeof value.text !== "string" || value.text.length > LILA_INTENTION_MAX_CHARS || !validTheme || typeof value.expiresAt !== "number" || !Number.isFinite(value.expiresAt) || value.expiresAt <= now || value.expiresAt > now + LILA_DRAFT_TTL_MS) {
      clearLilaDraft(storage);
      return null;
    }
    return { text: value.text, theme: value.theme! };
  } catch {
    clearLilaDraft(storage);
    return null;
  }
}

export function writeLilaDraft(draft: LilaDraft, storage: DateStorage | null = browserStorage(), now = Date.now()): boolean {
  try {
    if (!draft.text.trim()) { clearLilaDraft(storage); return true; }
    if (!storage) return false;
    storage.setItem(LILA_DRAFT_KEY, JSON.stringify({ ...draft, expiresAt: now + LILA_DRAFT_TTL_MS }));
    return true;
  } catch { return false; }
}
