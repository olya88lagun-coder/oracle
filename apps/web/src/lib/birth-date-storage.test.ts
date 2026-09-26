import { describe, expect, test } from "vitest";
import { BIRTH_DATE_KEY, browserStorage, clearStoredBirthDate, pickBirthDate, readStoredBirthDate, storeBirthDate, type DateStorage } from "./birth-date-storage";

const TODAY = new Date("2026-09-26T12:00:00Z");

function memoryStorage(initial: Record<string, string> = {}): DateStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const broken: DateStorage = {
  getItem: () => {
    throw new Error("denied");
  },
  setItem: () => {
    throw new Error("denied");
  },
  removeItem: () => {
    throw new Error("denied");
  },
};

describe("readStoredBirthDate", () => {
  test("returns a valid stored date", () => {
    expect(readStoredBirthDate(memoryStorage({ [BIRTH_DATE_KEY]: "1988-11-18" }), TODAY)).toBe("1988-11-18");
  });

  test("drops garbage and future dates", () => {
    const storage = memoryStorage({ [BIRTH_DATE_KEY]: "2099-01-01" });
    expect(readStoredBirthDate(storage, TODAY)).toBeNull();
    expect(storage.data.has(BIRTH_DATE_KEY)).toBe(false);
  });

  test("survives a missing or broken storage", () => {
    expect(readStoredBirthDate(null, TODAY)).toBeNull();
    expect(readStoredBirthDate(broken, TODAY)).toBeNull();
  });
});

describe("storeBirthDate and clearStoredBirthDate", () => {
  test("write and remove the key", () => {
    const storage = memoryStorage();
    storeBirthDate(storage, "1990-05-14");
    expect(storage.data.get(BIRTH_DATE_KEY)).toBe("1990-05-14");
    clearStoredBirthDate(storage);
    expect(storage.data.has(BIRTH_DATE_KEY)).toBe(false);
  });

  test("never throw", () => {
    expect(() => storeBirthDate(broken, "1990-05-14")).not.toThrow();
    expect(() => clearStoredBirthDate(broken)).not.toThrow();
    expect(() => storeBirthDate(null, "1990-05-14")).not.toThrow();
  });
});

describe("pickBirthDate", () => {
  test("the portrait wins over the browser copy", () => {
    expect(pickBirthDate({ profile: "1990-05-14", stored: "1988-11-18" })).toEqual({ date: "1990-05-14", source: "profile" });
  });

  test("falls back to the browser copy, then to nothing", () => {
    expect(pickBirthDate({ profile: null, stored: "1988-11-18" })).toEqual({ date: "1988-11-18", source: "browser" });
    expect(pickBirthDate({ profile: null, stored: null })).toEqual({ date: null, source: null });
  });
});

describe("browserStorage", () => {
  test("is null outside the browser", () => {
    expect(browserStorage()).toBeNull();
  });
});
