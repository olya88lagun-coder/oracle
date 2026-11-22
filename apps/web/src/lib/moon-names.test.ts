import { describe, expect, test } from "vitest";
import { dayPhaseName, PHASE_NAMES } from "./moon-names";

describe("dayPhaseName", () => {
  test("names the main phase on the day it happens", () => {
    expect(dayPhaseName("full", "full")).toBe("Полнолуние");
    expect(dayPhaseName("firstQuarter", "firstQuarter")).toBe("Первая четверть");
    // Событие случилось ночью, а на полдень Луна ещё в соседнем промежутке: день всё равно называется по событию
    expect(dayPhaseName("waxingCrescent", "firstQuarter")).toBe("Первая четверть");
  });

  test("says «около» on the days around a main phase, where the phase bucket is called after it but the phase itself is not on that day", () => {
    expect(dayPhaseName("full", null)).toBe("Около полнолуния");
    expect(dayPhaseName("new", null)).toBe("Около новолуния");
    expect(dayPhaseName("firstQuarter", null)).toBe("Около первой четверти");
    expect(dayPhaseName("lastQuarter", null)).toBe("Около последней четверти");
  });

  test("leaves the other phases as they are", () => {
    for (const phase of ["waxingCrescent", "waxingGibbous", "waningGibbous", "waningCrescent"] as const) expect(dayPhaseName(phase, null)).toBe(PHASE_NAMES[phase]);
  });
});
