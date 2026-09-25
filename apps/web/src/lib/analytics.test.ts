import { afterEach, describe, expect, test, vi } from "vitest";
import { CONSENT_KEY, GOALS, reachGoal, readChoice, sanitizePath, sanitizeReferrer, saveChoice } from "./analytics";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
}

const brokenStorage = {
  getItem: () => {
    throw new Error("denied");
  },
  setItem: () => {
    throw new Error("denied");
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cookie choice", () => {
  test("reads only known values", () => {
    expect(readChoice(memoryStorage({ [CONSENT_KEY]: "all" }))).toBe("all");
    expect(readChoice(memoryStorage({ [CONSENT_KEY]: "necessary" }))).toBe("necessary");
    expect(readChoice(memoryStorage({ [CONSENT_KEY]: "yes" }))).toBeNull();
    expect(readChoice(memoryStorage())).toBeNull();
  });

  test("survives a storage that refuses access", () => {
    expect(readChoice(brokenStorage)).toBeNull();
    expect(() => saveChoice(brokenStorage, "all")).not.toThrow();
  });

  test("saves the choice under the consent key", () => {
    const storage = memoryStorage();

    saveChoice(storage, "necessary");

    expect(storage.getItem(CONSENT_KEY)).toBe("necessary");
  });
});

describe("sanitizePath", () => {
  test("drops the query and the hash", () => {
    expect(sanitizePath("/portret?from=login#date")).toBe("/portret");
    expect(sanitizePath("")).toBe("/");
  });
});

describe("sanitizeReferrer", () => {
  test("keeps our own path without the query and only the origin of other sites", () => {
    expect(sanitizeReferrer("https://oracle.test/portret?from=login", "https://oracle.test")).toBe("https://oracle.test/portret");
    expect(sanitizeReferrer("https://yandex.ru/search/?text=матрица", "https://oracle.test")).toBe("https://yandex.ru");
  });

  test("is empty for no or broken referrers", () => {
    expect(sanitizeReferrer("", "https://oracle.test")).toBeUndefined();
    expect(sanitizeReferrer("not a url", "https://oracle.test")).toBeUndefined();
  });
});

describe("reachGoal", () => {
  test("sends the goal to the loaded counter", () => {
    const ym = vi.fn();
    vi.stubGlobal("window", { ym });

    reachGoal("login", undefined, 123);

    expect(ym).toHaveBeenCalledWith(123, "reachGoal", "login", undefined);
  });

  test("does nothing without a counter id or before Metrika is loaded", () => {
    const ym = vi.fn();
    vi.stubGlobal("window", { ym });

    reachGoal("login", undefined, null);
    vi.stubGlobal("window", {});
    reachGoal("birth_date_saved", undefined, 123);

    expect(ym).not.toHaveBeenCalled();
  });

  test("the plan 1 funnel has exactly two goals", () => {
    expect(GOALS).toEqual(["login", "birth_date_saved"]);
  });
});
