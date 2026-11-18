import { describe, expect, test } from "vitest";
import { markThreadIntent, takeThreadIntent, THREAD_PENDING_KEY, threadPurchaseBody } from "./thread-offer";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k), data };
}

describe("threadPurchaseBody", () => {
  test("sends the product, the e-mail and the bare ISO date", () => {
    expect(threadPurchaseBody({ iso: "1990-03-07", email: "a@b.ru", free: false })).toEqual({ product: "thread_report", email: "a@b.ru", birth: "1990-03-07" });
  });

  test("the owner's free purchase has no e-mail", () => {
    expect(threadPurchaseBody({ iso: "1990-03-07", email: "", free: true })).toEqual({ product: "thread_report", birth: "1990-03-07" });
  });
});

describe("thread login intent", () => {
  test("keeps the date in the tab storage and erases it on reading", () => {
    const storage = fakeStorage();
    markThreadIntent(storage, "1990-03-07");
    expect(storage.data.get(THREAD_PENDING_KEY)).toBe("1990-03-07");
    expect(takeThreadIntent(storage)).toBe("1990-03-07");
    expect(storage.data.size).toBe(0);
    expect(takeThreadIntent(storage)).toBeNull();
  });

  test("a foreign or broken value is dropped, and a missing storage is fine", () => {
    const storage = fakeStorage({ [THREAD_PENDING_KEY]: "<script>" });
    expect(takeThreadIntent(storage)).toBeNull();
    expect(storage.data.size).toBe(0);
    expect(takeThreadIntent(null)).toBeNull();
    expect(() => markThreadIntent(null, "1990-03-07")).not.toThrow();
  });
});
