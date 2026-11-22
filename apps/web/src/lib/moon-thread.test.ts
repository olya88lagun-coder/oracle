import { PHASES } from "@oracle/core/moon";
import { describe, expect, test } from "vitest";
import { buildThreadDays, threadBeads } from "./moon-thread";
import { lastDays } from "./moon-visit";

const NOW = new Date("2026-11-22T09:00:00Z");

describe("buildThreadDays", () => {
  test("returns 14 consecutive days ending today, each with a known phase", () => {
    const days = buildThreadDays(NOW);
    expect(days).toHaveLength(14);
    expect(days.map((day) => day.date)).toEqual(lastDays("2026-11-22", 14));
    for (const day of days) expect(PHASES).toContain(day.phase);
  });

  test("takes the date from Moscow, not UTC", () => {
    expect(buildThreadDays(new Date("2026-11-22T21:30:00Z")).at(-1)?.date).toBe("2026-11-23");
  });
});

describe("threadBeads", () => {
  const days = buildThreadDays(NOW);

  test("lights exactly the visited days and marks today", () => {
    const beads = threadBeads(days, ["2026-11-20", "2026-11-22", "2026-10-01"], "2026-11-22");
    expect(beads.filter((bead) => bead.lit).map((bead) => bead.date)).toEqual(["2026-11-20", "2026-11-22"]);
    expect(beads.filter((bead) => bead.isToday)).toHaveLength(1);
    expect(beads.at(-1)).toMatchObject({ isToday: true, label: "сег" });
    expect(beads[0]).toMatchObject({ date: "2026-11-09", label: "9" });
  });

  test("with no visits lights nothing", () => {
    expect(threadBeads(days, [], "2026-11-22").some((bead) => bead.lit)).toBe(false);
  });
});
