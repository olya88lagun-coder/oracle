import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { adParams, checkoutParams, CONSENT_KEY, GOALS, hitUrl, reachGoal, reachGoalThenNavigate, readChoice, sanitizePath, sanitizeReferrer, saveChoice } from "./analytics";

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
  test.each([
    "/portret/razbor/bc146faf-3591-42d3-a282-48fcfa7748bc",
    "/lila/igra/oplata/bc146faf-3591-42d3-a282-48fcfa7748bc",
    "/portret/lila/BC146FAF-3591-42D3-A282-48FCFA7748BC",
  ])("redacts the private UUID segment in %s", (path) => {
    expect(sanitizePath(path)).toBe(path.slice(0, path.lastIndexOf("/") + 1) + ":id");
  });

  test("redacts encoded UUIDs and middle segments, keeping public slugs and trailing slash", () => {
    expect(sanitizePath("/portret/razbor/%62c146faf-3591-42d3-a282-48fcfa7748bc/pdf/?email=private#x")).toBe("/portret/razbor/:id/pdf/");
    expect(sanitizePath("/natalnaya-karta/solnce-v-ovne")).toBe("/natalnaya-karta/solnce-v-ovne");
    expect(sanitizePath("/lila/kletki/12")).toBe("/lila/kletki/12");
    expect(sanitizePath("/broken/%ZZ")).toBe("/broken/%ZZ");
  });

  test("redacts private IDs in hits and internal referrers while preserving safe campaign tags", () => {
    const path = "/portret/razbor/bc146faf-3591-42d3-a282-48fcfa7748bc";
    expect(hitUrl("https://oracle.test", path, "?utm_source=yandex&email=private")).toBe("https://oracle.test/portret/razbor/:id?utm_source=yandex");
    expect(sanitizeReferrer(`https://oracle.test${path}?email=private`, "https://oracle.test")).toBe("https://oracle.test/portret/razbor/:id");
  });

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
    expect(GOALS).toEqual(["login", "birth_date_saved", "matrix_calculated", "matrix_save_click", "matrix_share", "arcana_to_calculator", "report_offer_view", "report_offer_click", "report_paid", "report_opened", "report_pdf_download", "lila_start", "lila_finish", "lila_save", "lila_offer_click", "lila_paid", "compat_calculated", "compat_share", "compat_pdf", "compat_offer_view", "compat_offer_click", "taro_draw", "taro_share", "lila_offer_view", "lila_login_click", "checkout_redirect", "checkout_error", "natal_calculated", "natal_save_click", "natal_share", "natal_to_calculator", "natal_offer_view", "natal_offer_click", "natal_paid", "natal_report_opened", "taro_spread", "taro_to_practice"]);
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
