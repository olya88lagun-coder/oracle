import { describe, expect, test } from "vitest";
import { normalizeClockInput } from "./clock-lookup";

describe("normalizeClockInput", () => {
  test.each([["11:11", "11:11"], ["1111", "11:11"], ["1.11", "01:11"], [" 5:50 ", "05:50"], ["00:00", "00:00"], ["23-32", "23:32"]])("%s → %s", (raw, expected) => {
    expect(normalizeClockInput(raw)).toBe(expected);
  });

  test.each(["", "24:00", "12:60", "abc", "1:1", "123:45", "12:345"])("%s is not a time", (raw) => {
    expect(normalizeClockInput(raw)).toBeNull();
  });
});
