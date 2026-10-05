import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { adParams, checkoutParams, CONSENT_KEY, GOALS, hitUrl, reachGoal, reachGoalOnce, reachGoalThenNavigate, readChoice, sanitizePath, sanitizeReferrer, saveChoice } from "./analytics";

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

describe("ad parameters", () => {
  test("keeps only the Direct and UTM tags", () => {
    expect(adParams("?yclid=123456&utm_source=yandex&utm_campaign=matrix-test&from=login&next=%2Fportret")).toBe("?yclid=123456&utm_source=yandex&utm_campaign=matrix-test");
  });

  test("keeps readable Cyrillic and spaces in a tag", () => {
    expect(adParams("?utm_term=%D0%BC%D0%B0%D1%82%D1%80%D0%B8%D1%86%D0%B0+%D1%81%D1%83%D0%B4%D1%8C%D0%B1%D1%8B")).toBe("?utm_term=%D0%BC%D0%B0%D1%82%D1%80%D0%B8%D1%86%D0%B0+%D1%81%D1%83%D0%B4%D1%8C%D0%B1%D1%8B");
  });

  test("drops a tag whose value could carry personal data", () => {
    expect(adParams("?utm_source=a%40b.ru")).toBe("");
    expect(adParams("?utm_term=" + "x".repeat(101))).toBe("");
    expect(adParams("?utm_content=1988-11-18%2F%3Fq")).toBe("");
  });

  test("is empty without tags or without a query", () => {
    expect(adParams("")).toBe("");
    expect(adParams("?birthDate=1988-11-18")).toBe("");
  });

  test("the hit address is the path plus the tags and nothing else", () => {
    expect(hitUrl("https://oracle.test", "/matrica-sudby", "?yclid=99&birthDate=1988-11-18")).toBe("https://oracle.test/matrica-sudby?yclid=99");
    expect(hitUrl("https://oracle.test", "/portret", "?from=login")).toBe("https://oracle.test/portret");
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

  test("reports whether the counter accepted the goal", () => {
    vi.stubGlobal("window", { ym: vi.fn() });
    expect(reachGoal("login", undefined, 123)).toBe(true);
    vi.stubGlobal("window", {});
    expect(reachGoal("login", undefined, 123)).toBe(false);
    expect(reachGoal("login", undefined, null)).toBe(false);
  });

  test("the funnel goals of plans 1, 2a, 3a and 3b", () => {
    expect(GOALS).toEqual(["login", "birth_date_saved", "matrix_calculated", "matrix_save_click", "matrix_share", "arcana_to_calculator", "report_offer_view", "report_offer_click", "report_paid", "report_opened", "report_pdf_download", "lila_start", "lila_finish", "lila_save", "lila_offer_click", "lila_paid", "compat_calculated", "compat_share", "compat_pdf", "compat_offer_view", "compat_offer_click", "taro_draw", "taro_share", "lila_offer_view", "lila_login_click", "checkout_redirect", "checkout_error"]);
  });
});

describe("reachGoalOnce", () => {
  const memoryStorage = () => {
    const data = new Map<string, string>();
    return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("sends the goal once per key and marks it only after the counter accepted it", () => {
    const ym = vi.fn();
    vi.stubGlobal("window", { ym });
    const storage = memoryStorage();

    reachGoalOnce("lila_paid", "paid:1", 123, storage);
    reachGoalOnce("lila_paid", "paid:1", 123, storage);

    expect(ym).toHaveBeenCalledTimes(1);
    expect(storage.getItem("paid:1")).toBe("1");
  });

  test("waits for a counter that is not created yet instead of losing the goal", () => {
    vi.stubGlobal("window", {});
    const storage = memoryStorage();
    reachGoalOnce("report_paid", "paid:late", 123, storage);
    expect(storage.getItem("paid:late")).toBeNull();

    const ym = vi.fn();
    vi.stubGlobal("window", { ym });
    vi.advanceTimersByTime(1000);

    expect(ym).toHaveBeenCalledWith(123, "reachGoal", "report_paid", undefined);
    expect(storage.getItem("paid:late")).toBe("1");
  });

  test("gives up quietly and leaves no mark when there is no counter at all (cookies declined)", () => {
    vi.stubGlobal("window", {});
    const storage = memoryStorage();

    reachGoalOnce("report_paid", "paid:declined", 123, storage);
    vi.advanceTimersByTime(60_000);

    expect(storage.getItem("paid:declined")).toBeNull();
    // позже человек согласился на cookie — цель уходит
    const ym = vi.fn();
    vi.stubGlobal("window", { ym });
    reachGoalOnce("report_paid", "paid:declined", 123, storage);
    expect(ym).toHaveBeenCalledTimes(1);
  });

  test("does not double-send within one page when storage is unavailable", () => {
    const ym = vi.fn();
    vi.stubGlobal("window", { ym });

    reachGoalOnce("lila_paid", "paid:nostorage", 123, null);
    reachGoalOnce("lila_paid", "paid:nostorage", 123, null);

    expect(ym).toHaveBeenCalledTimes(1);
  });
});

describe("checkoutParams", () => {
  test("carries only the product and, for errors, a code", () => {
    expect(checkoutParams("lila")).toEqual({ product: "lila" });
    expect(checkoutParams("matrix", "rate_limited")).toEqual({ product: "matrix", error: "rate_limited" });
  });
});

describe("reachGoalThenNavigate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("navigates at once when there is no counter (cookies declined)", () => {
    vi.stubGlobal("window", {});
    const navigate = vi.fn();
    reachGoalThenNavigate("checkout_redirect", { product: "lila" }, "/pay", navigate, 123);
    expect(navigate).toHaveBeenCalledWith("/pay");
  });

  test("waits for the counter's callback and navigates exactly once", () => {
    const ym = vi.fn();
    vi.stubGlobal("window", { ym });
    const navigate = vi.fn();

    reachGoalThenNavigate("checkout_redirect", { product: "matrix" }, "/pay", navigate, 123);
    expect(navigate).not.toHaveBeenCalled();
    ym.mock.calls[0]![4]();
    vi.advanceTimersByTime(1000);

    expect(ym).toHaveBeenCalledWith(123, "reachGoal", "checkout_redirect", { product: "matrix" }, expect.any(Function));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  test("navigates after the fallback delay when the counter never answers", () => {
    vi.stubGlobal("window", { ym: vi.fn() });
    const navigate = vi.fn();
    reachGoalThenNavigate("checkout_redirect", { product: "lila" }, "/pay", navigate, 123);
    vi.advanceTimersByTime(300);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
