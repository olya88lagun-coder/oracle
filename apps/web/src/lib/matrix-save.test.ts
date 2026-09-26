import { describe, expect, test } from "vitest";
import { markSaveIntent, SAVE_INTENT_KEY, saveBlockState, sessionStore, shareContent, takeSaveIntent, type IntentStorage } from "./matrix-save";

const DATE = "1988-11-18";

describe("saveBlockState", () => {
  test.each([
    [{ signedIn: false, profileDate: null, date: DATE, status: "idle" }, "guest"],
    [{ signedIn: true, profileDate: null, date: DATE, status: "idle" }, "offer"],
    [{ signedIn: true, profileDate: "1990-05-14", date: DATE, status: "idle" }, "offer"],
    [{ signedIn: true, profileDate: DATE, date: DATE, status: "idle" }, "saved"],
    [{ signedIn: true, profileDate: null, date: DATE, status: "saving" }, "saving"],
    [{ signedIn: true, profileDate: null, date: DATE, status: "error" }, "error"],
  ] as const)("%o → %s", (input, expected) => {
    expect(saveBlockState(input)).toBe(expected);
  });
});

function memory(): IntentStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe("save intent", () => {
  test("is taken exactly once", () => {
    const storage = memory();
    markSaveIntent(storage);
    expect(storage.data.get(SAVE_INTENT_KEY)).toBe("1");
    expect(takeSaveIntent(storage)).toBe(true);
    expect(takeSaveIntent(storage)).toBe(false);
  });

  test("survives a missing or broken storage", () => {
    const broken: IntentStorage = {
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
    expect(() => markSaveIntent(broken)).not.toThrow();
    expect(takeSaveIntent(broken)).toBe(false);
    expect(takeSaveIntent(null)).toBe(false);
    expect(sessionStore()).toBeNull();
  });
});

describe("shareContent", () => {
  test("links to the arcanum page and never contains the birth date", () => {
    const content = shareContent({ number: 11, name: "Сила", slug: "sila" }, "https://oracle.test");

    expect(content).toEqual({
      title: "Мой центр в матрице судьбы — аркан 11, «Сила»",
      text: "Мой центр в матрице судьбы — аркан 11, «Сила»",
      url: "https://oracle.test/matrica-sudby/arkan-11-sila",
    });
    expect(JSON.stringify(content)).not.toMatch(/\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4}/);
  });
});
