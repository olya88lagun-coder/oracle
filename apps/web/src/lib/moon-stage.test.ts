import { describe, expect, test } from "vitest";
import { arcProgress, countdownLabel, moscowMinutes, nextStageEvent } from "./moon-stage";

describe("arcProgress", () => {
  test("is 0 at the rise, 0.5 in the middle and 1 at the set of a Moon that rises and sets on the same day", () => {
    expect(arcProgress(600, 1200, 600)).toBe(0);
    expect(arcProgress(600, 1200, 900)).toBe(0.5);
    expect(arcProgress(600, 1200, 1200)).toBe(1);
  });

  test("counts through midnight when the Moon rises in the evening and sets in the morning", () => {
    expect(arcProgress(1200, 360, 1200)).toBe(0);
    expect(arcProgress(1200, 360, 60)).toBeCloseTo(300 / 600);
    expect(arcProgress(1200, 360, 360)).toBe(1);
  });

  test("is null while the Moon is below the horizon, and when the rise or the set is unknown", () => {
    expect(arcProgress(600, 1200, 300)).toBeNull();
    expect(arcProgress(600, 1200, 1300)).toBeNull();
    expect(arcProgress(null, 1200, 900)).toBeNull();
    expect(arcProgress(600, null, 900)).toBeNull();
  });
});

describe("countdownLabel", () => {
  test("shows days and hours, hours and minutes, or minutes", () => {
    expect(countdownLabel((3 * 1440 + 4 * 60 + 30) * 60_000)).toBe("3 д 4 ч");
    expect(countdownLabel((5 * 60 + 12) * 60_000)).toBe("5 ч 12 мин");
    expect(countdownLabel(12 * 60_000)).toBe("12 мин");
  });

  test("says «меньше минуты» for the last seconds and for time that has passed", () => {
    expect(countdownLabel(59_000)).toBe("меньше минуты");
    expect(countdownLabel(-5_000)).toBe("меньше минуты");
  });
});

describe("nextStageEvent", () => {
  const events = [{ at: 100, genitive: "первой четверти" }, { at: 300, genitive: "полнолуния" }];

  test("picks the nearest event after now, and falls back to the first event of the next month", () => {
    expect(nextStageEvent(events, null, 50)?.genitive).toBe("первой четверти");
    expect(nextStageEvent(events, null, 150)?.genitive).toBe("полнолуния");
    expect(nextStageEvent(events, { at: 900, genitive: "новолуния" }, 400)?.genitive).toBe("новолуния");
    expect(nextStageEvent(events, null, 400)).toBeNull();
  });
});

describe("moscowMinutes", () => {
  test("gives the minutes since midnight in Moscow (UTC+3)", () => {
    expect(moscowMinutes(Date.UTC(2026, 10, 20, 0, 0))).toBe(180);
    expect(moscowMinutes(Date.UTC(2026, 10, 20, 21, 30))).toBe(30);
    expect(moscowMinutes(Date.UTC(2026, 10, 20, 9, 15))).toBe(12 * 60 + 15);
  });
});
