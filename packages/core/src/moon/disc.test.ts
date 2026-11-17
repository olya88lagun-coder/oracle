import { describe, expect, test } from "vitest";
import { discEquatorSpan, discLitPath } from "./disc";

describe("discEquatorSpan", () => {
  test("a waxing Moon is lit on the right, a waning one on the left", () => {
    expect(discEquatorSpan(0.5, true, 100)).toEqual({ from: 0, to: 100 });
    expect(discEquatorSpan(0.5, false, 100)).toEqual({ from: -100, to: 0 });
  });

  test("full Moon fills the whole width, new Moon has none", () => {
    expect(discEquatorSpan(1, true, 100)).toEqual({ from: -100, to: 100 });
    expect(discEquatorSpan(1, false, 100)).toEqual({ from: -100, to: 100 });
    const dark = discEquatorSpan(0, true, 100);
    expect(dark.from).toBe(dark.to);
  });

  test("a crescent is narrower and a gibbous Moon wider than half", () => {
    const crescent = discEquatorSpan(0.25, true, 100);
    const gibbous = discEquatorSpan(0.75, true, 100);
    expect(crescent.to - crescent.from).toBeCloseTo(50, 6);
    expect(gibbous.to - gibbous.from).toBeCloseTo(150, 6);
  });
});

describe("discLitPath", () => {
  test("is empty for the new Moon", () => {
    expect(discLitPath(0, true, 100)).toBe("");
    expect(discLitPath(0, false, 100)).toBe("");
  });

  test("is a closed full-disc outline for the full Moon, without NaN", () => {
    const path = discLitPath(1, true, 100);
    expect(path.length).toBeGreaterThan(0);
    expect(path).not.toContain("NaN");
    expect(path.trim().endsWith("Z")).toBe(true);
  });

  test("starts with a move, has two arcs and no NaN for every illumination in both directions", () => {
    for (const waxing of [true, false]) {
      for (const illumination of [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
        const path = discLitPath(illumination, waxing, 100);
        expect(path.startsWith("M")).toBe(true);
        expect(path.match(/A/g)).toHaveLength(2);
        expect(path).not.toContain("NaN");
      }
    }
  });

  test("the terminator's horizontal radius is the distance of the terminator from the centre", () => {
    for (const illumination of [0.1, 0.25, 0.75, 0.9]) {
      const arcs = [...discLitPath(illumination, true, 100).matchAll(/A\s*([\d.]+)\s+([\d.]+)/g)];
      expect(Number(arcs[0]![1])).toBeCloseTo(100, 1);
      expect(Number(arcs[1]![1])).toBeCloseTo(100 * Math.abs(1 - 2 * illumination), 1);
      expect(Number(arcs[1]![2])).toBeCloseTo(100, 1);
    }
  });
});
