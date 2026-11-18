import { calculateLifeThread } from "@oracle/core";
import { expect, test } from "vitest";
import { threadPosterSpec } from "./poster-thread";

const thread = calculateLifeThread("1990-07-15", new Date("2026-11-18T12:00:00Z"));
if (!thread) throw new Error("bad date");

test("the story picture spec carries years and the current year, but never the date of birth", () => {
  const spec = threadPosterSpec(thread);
  const dump = JSON.stringify(spec);
  for (const secret of ["1990-07-15", "15.07", "15 июля", "15/07"]) expect(dump).not.toContain(secret);
  expect(spec.nowLabel).toBe("Год 5 · перемены");
  expect(spec.footer).toBe("ТВОЙ ОРАКУЛ · TVOY-ORAKUL.RU");
  expect(spec.fileName).toBe("nit-lichnyh-let");
});

test("the points cover 19 years inside the box, the current year is marked and labelled", () => {
  const spec = threadPosterSpec(thread);
  expect(spec.points).toHaveLength(19);
  for (const point of spec.points) {
    expect(point.x).toBeGreaterThanOrEqual(0);
    expect(point.x).toBeLessThanOrEqual(1000);
    expect(point.y).toBeGreaterThanOrEqual(0);
    expect(point.y).toBeLessThanOrEqual(300);
  }
  expect(spec.nowIndex).toBe(9);
  expect(spec.yearLabels.map((label) => label.text)).toContain("2026");
});
