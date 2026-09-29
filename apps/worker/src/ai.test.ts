import type { ReportWriter } from "@oracle/ai";
import { describe, expect, test } from "vitest";
import { limitConcurrency } from "./ai";

function slowWriter(track: { running: number; peak: number }): ReportWriter {
  return {
    name: "slow",
    async complete() {
      track.running += 1;
      track.peak = Math.max(track.peak, track.running);
      await new Promise((resolve) => setTimeout(resolve, 10));
      track.running -= 1;
      return "ok";
    },
  };
}

describe("limitConcurrency", () => {
  test("returns nothing for no writer", () => {
    expect(limitConcurrency(null, 1)).toBeNull();
  });

  test("never runs more than the limit at once and still answers every call", async () => {
    const track = { running: 0, peak: 0 };
    const limited = limitConcurrency(slowWriter(track), 1)!;
    const signal = new AbortController().signal;
    const answers = await Promise.all([1, 2, 3].map(() => limited.complete({ system: "s", user: "u" }, signal)));
    expect(answers).toEqual(["ok", "ok", "ok"]);
    expect(track.peak).toBe(1);
    expect(limited.name).toBe("slow");
  });

  test("lets two run together when the limit is two, and frees the slot after a failure", async () => {
    const track = { running: 0, peak: 0 };
    const limited = limitConcurrency(slowWriter(track), 2)!;
    const signal = new AbortController().signal;
    await Promise.all([1, 2, 3, 4].map(() => limited.complete({ system: "s", user: "u" }, signal)));
    expect(track.peak).toBe(2);

    const failing = limitConcurrency({ name: "bad", complete: () => Promise.reject(new Error("x")) }, 1)!;
    await expect(failing.complete({ system: "s", user: "u" }, signal)).rejects.toThrow("x");
    await expect(failing.complete({ system: "s", user: "u" }, signal)).rejects.toThrow("x");
  });
});
