import { computeNatalChart } from "@oracle/core/natal";
import { CITIES } from "@oracle/geo";
import { describe, expect, test } from "vitest";
import { planCalculation, type CalcDeps } from "./natal-calc";
import type { NatalInput } from "./natal-input";
import { buildBirthMoment } from "./natal-moment";

const deps: CalcDeps = { buildBirthMoment, computeNatalChart };
const moscow = CITIES.find((candidate) => candidate.name === "Москва" && candidate.country === "Россия");
if (!moscow) throw new Error("В базе нет Москвы");
const input = (date: string, time: string | null): NatalInput => ({ date, time, city: moscow });

describe("planCalculation", () => {
  test("builds the chart for an ordinary local time", () => {
    const outcome = planCalculation(input("1990-03-07", "12:00"), null, deps);
    expect(outcome.kind).toBe("chart");
    if (outcome.kind !== "chart") return;
    expect(outcome).toMatchObject({ clock: "ok", correctedTime: null });
    expect(outcome.chart.timeKnown).toBe(true);
    expect(outcome.chart.ascendant?.sign).toBe("cancer");
  });

  test("builds a chart without angles when the time is unknown", () => {
    const outcome = planCalculation(input("1990-03-07", null), null, deps);
    expect(outcome.kind).toBe("chart");
    if (outcome.kind !== "chart") return;
    expect(outcome.chart.timeKnown).toBe(false);
    expect(outcome.chart.ascendant).toBeNull();
  });

  test("a time that did not exist is moved to the nearest one that did, and the chart is built", () => {
    const outcome = planCalculation(input("1981-04-01", "00:30"), null, deps);
    expect(outcome).toMatchObject({ kind: "chart", clock: "gap", correctedTime: "01:30" });
  });

  test("a time that happened twice builds no chart until the person chooses", () => {
    expect(planCalculation(input("1990-09-30", "02:30"), null, deps)).toEqual({ kind: "needs-choice", clock: "ambiguous" });
  });

  test("the first and the second time give different charts", () => {
    const first = planCalculation(input("1990-09-30", "02:30"), "first", deps);
    const second = planCalculation(input("1990-09-30", "02:30"), "second", deps);
    expect(first.kind).toBe("chart");
    expect(second.kind).toBe("chart");
    if (first.kind !== "chart" || second.kind !== "chart") return;
    expect(first.clock).toBe("ambiguous");
    expect(first.chart.ascendant?.longitude).not.toBe(second.chart.ascendant?.longitude);
  });

  test("lets errors of the core through to the caller", () => {
    const failing: CalcDeps = {
      ...deps,
      computeNatalChart: () => {
        throw new RangeError("Некорректные координаты");
      },
    };
    expect(() => planCalculation(input("1990-03-07", "12:00"), null, failing)).toThrow(RangeError);
  });
});
