import { describe, expect, test } from "vitest";
import { eclipticLongitude } from "../natal/bodies";
import { SIGNS, signOf } from "../natal/zodiac";
import { moonSignChanges } from "./signs";

const DAY = 86_400_000;
const FROM = new Date("2026-11-01T00:00:00Z");
const TO = new Date("2026-12-01T00:00:00Z");
const signAt = (date: Date) => signOf(eclipticLongitude("moon", date)).sign;

describe("moonSignChanges over November 2026", () => {
  const changes = moonSignChanges(FROM, TO);

  test("finds 12 to 15 sign changes in a month", () => {
    expect(changes.length).toBeGreaterThanOrEqual(12);
    expect(changes.length).toBeLessThanOrEqual(15);
  });

  test("each change enters the next sign of the zodiac, wrapping from Pisces to Aries", () => {
    changes.forEach((change, index) => {
      const previous = index === 0 ? signAt(FROM) : changes[index - 1]!.sign;
      expect(SIGNS[(SIGNS.indexOf(previous) + 1) % 12]).toBe(change.sign);
    });
  });

  test("changes come in increasing order, one every one and a half to three and a half days", () => {
    for (let index = 1; index < changes.length; index++) {
      const gap = (changes[index]!.at.getTime() - changes[index - 1]!.at.getTime()) / DAY;
      expect(gap).toBeGreaterThan(1.5);
      expect(gap).toBeLessThan(3.5);
    }
  });

  test("the Moon is in the old sign a minute before a change and in the new sign at it", () => {
    for (const change of changes) {
      expect(signAt(new Date(change.at.getTime() - 60_000))).not.toBe(change.sign);
      expect(signAt(change.at)).toBe(change.sign);
    }
  });
});

describe("moonSignChanges windows", () => {
  const all = moonSignChanges(FROM, TO);

  test("an empty window has no changes", () => {
    expect(moonSignChanges(FROM, FROM)).toEqual([]);
  });

  test("a ten-minute window around a known change finds exactly that change", () => {
    const known = all[3]!;
    const found = moonSignChanges(new Date(known.at.getTime() - 5 * 60_000), new Date(known.at.getTime() + 5 * 60_000));
    expect(found).toHaveLength(1);
    expect(found[0]!.sign).toBe(known.sign);
    expect(Math.abs(found[0]!.at.getTime() - known.at.getTime())).toBeLessThan(60_000);
  });

  test("two adjacent windows give the same changes as one big window, with none lost or doubled at the seam", () => {
    const middle = new Date("2026-11-16T12:00:00Z");
    const parts = [...moonSignChanges(FROM, middle), ...moonSignChanges(middle, TO)];
    expect(parts.map((change) => change.sign)).toEqual(all.map((change) => change.sign));
    parts.forEach((change, index) => expect(Math.abs(change.at.getTime() - all[index]!.at.getTime())).toBeLessThan(60_000));
  });
});
