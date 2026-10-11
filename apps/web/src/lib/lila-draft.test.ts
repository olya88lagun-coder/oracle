import { describe, expect, test } from "vitest";
import { clearLilaDraft, LILA_DRAFT_KEY, LILA_DRAFT_TTL_MS, readLilaDraft, writeLilaDraft } from "./lila-draft";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), removeItem: (key: string) => void data.delete(key) };
};

describe("intention drafts", () => {
  test("restores a selected theme and custom text until expiry", () => {
    const storage = memory();
    expect(writeLilaDraft({ text: "Мой вопрос о работе", theme: "1" }, storage, 100)).toBe(true);
    expect(readLilaDraft(storage, 101)).toEqual({ text: "Мой вопрос о работе", theme: "1" });
    expect(readLilaDraft(storage, 100 + LILA_DRAFT_TTL_MS)).toBeNull();
    expect(storage.getItem(LILA_DRAFT_KEY)).toBeNull();
  });
  test("erases an empty or explicitly cleared draft", () => {
    const storage = memory();
    writeLilaDraft({ text: "Вопрос", theme: "" }, storage, 100);
    writeLilaDraft({ text: "  ", theme: "" }, storage, 101);
    expect(readLilaDraft(storage, 102)).toBeNull();
    writeLilaDraft({ text: "Другой вопрос", theme: "" }, storage, 103);
    clearLilaDraft(storage);
    expect(readLilaDraft(storage, 104)).toBeNull();
  });
  test("drops malformed data, invalid themes and oversized questions", () => {
    const storage = memory();
    for (const raw of ["not-json", "null", JSON.stringify({ text: "Вопрос", theme: "99", expiresAt: 200 }), JSON.stringify({ text: "я".repeat(301), theme: "", expiresAt: 200 }), JSON.stringify({ text: "Вопрос", theme: "", expiresAt: 100 + LILA_DRAFT_TTL_MS + 1 })]) {
      storage.setItem(LILA_DRAFT_KEY, raw);
      expect(readLilaDraft(storage, 100)).toBeNull();
      expect(storage.getItem(LILA_DRAFT_KEY)).toBeNull();
    }
  });
  test("keeps the form usable when browser storage is blocked", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(readLilaDraft(blocked)).toBeNull();
    expect(writeLilaDraft({ text: "Вопрос", theme: "" }, blocked)).toBe(false);
    expect(writeLilaDraft({ text: "Вопрос", theme: "" }, null)).toBe(false);
    expect(() => clearLilaDraft(blocked)).not.toThrow();
  });
});
