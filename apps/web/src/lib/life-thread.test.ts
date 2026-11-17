import { expect, test } from "vitest";
import { DATE_ERROR } from "./matrix-save";
import { PERIOD_POSITIONS, THREAD_FAQ, THREAD_PATH, threadOutcome } from "./life-thread";

const TODAY = new Date("2026-11-18T12:00:00Z");

test("the page lives under /numerologiya", () => {
  expect(THREAD_PATH).toBe("/numerologiya/grafik-sudby");
});

test("threadOutcome gives the thread for a real date", () => {
  const outcome = threadOutcome("1990-07-15", TODAY);
  expect(outcome.ok).toBe(true);
  if (outcome.ok) {
    expect(outcome.iso).toBe("1990-07-15");
    expect(outcome.thread.lifePath).toBe(5);
  }
});

test("an impossible date, a future date and an empty field give the date error", () => {
  for (const value of ["1990-02-31", "2030-01-01", ""]) expect(threadOutcome(value, TODAY)).toEqual({ ok: false, error: DATE_ERROR });
});

test("the four period positions have their names", () => {
  expect(PERIOD_POSITIONS).toEqual({ 1: "формирование", 2: "зрелость", 3: "плоды", 4: "мудрость" });
});

test("the FAQ has six questions and the answer about prediction starts with «Нет.»", () => {
  expect(THREAD_FAQ).toHaveLength(6);
  const prediction = THREAD_FAQ.find((item) => item.question.includes("предсказание"));
  expect(prediction?.answer.startsWith("Нет.")).toBe(true);
  for (const item of THREAD_FAQ) if (item !== prediction) expect(item.answer.toLowerCase()).not.toContain("предсказ");
});
