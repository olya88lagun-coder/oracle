import { afterEach, expect, test, vi } from "vitest";
import { markAnalyticsReady, setAnalyticsConsent } from "./analytics-runtime";
import { reachYearGoal } from "./year-arcana-analytics";

afterEach(() => { setAnalyticsConsent(false); vi.unstubAllGlobals(); });

test("year events require consent and SDK readiness and never carry birth data", () => {
  const ym = vi.fn();
  vi.stubGlobal("window", { ym });
  expect(reachYearGoal("year_arcana_calculated")).toBe(false);
  setAnalyticsConsent(true);
  expect(reachYearGoal("year_arcana_calculated")).toBe(false);
  markAnalyticsReady();
  expect(reachYearGoal("year_arcana_calculated")).toBe(true);
  expect(ym).toHaveBeenCalledExactlyOnceWith(113068094, "reachGoal", "year_arcana_calculated", undefined);
  setAnalyticsConsent(false);
  expect(reachYearGoal("year_arcana_save")).toBe(false);
  expect(ym).toHaveBeenCalledTimes(1);
});
