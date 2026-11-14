import { describe, expect, test } from "vitest";
import { addSeenCard, formatUntilNextCard, moscowDayKey, msUntilNextMoscowDay, pickCardIndex, readDayCard, readSeenCards, TARO_DAY_KEY, TARO_SEEN_KEY, writeDayCard } from "./taro-day";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe("moscowDayKey", () => {
  test("changes at midnight Moscow time, not UTC", () => {
    expect(moscowDayKey(new Date("2026-10-05T20:59:59Z"))).toBe("2026-10-05");
    expect(moscowDayKey(new Date("2026-10-05T21:00:00Z"))).toBe("2026-10-06");
  });
});

describe("time until the next card", () => {
  test("counts down to midnight Moscow time", () => {
    expect(msUntilNextMoscowDay(new Date("2026-10-05T20:59:59Z"))).toBe(1000);
    expect(msUntilNextMoscowDay(new Date("2026-10-05T21:00:00Z"))).toBe(86_400_000);
  });

  test("formats hours and minutes, rounding up", () => {
    expect(formatUntilNextCard(6 * 3_600_000 + 12 * 60_000)).toBe("6 ч 12 мин");
    expect(formatUntilNextCard(2 * 3_600_000)).toBe("2 ч");
    expect(formatUntilNextCard(45 * 60_000)).toBe("45 мин");
    expect(formatUntilNextCard(1000)).toBe("1 мин");
  });
});

describe("seen cards storage", () => {
  test("collects each card once and ignores garbage", () => {
    const storage = memory();
    expect(readSeenCards(storage)).toEqual([]);
    expect(addSeenCard(storage, "mag")).toEqual(["mag"]);
    expect(addSeenCard(storage, "sila")).toEqual(["mag", "sila"]);
    expect(addSeenCard(storage, "mag")).toEqual(["mag", "sila"]);
    storage.setItem(TARO_SEEN_KEY, "не json");
    expect(readSeenCards(storage)).toEqual([]);
    storage.setItem(TARO_SEEN_KEY, JSON.stringify(["mag", 7, null]));
    expect(readSeenCards(storage)).toEqual(["mag"]);
  });

  test("survives a storage that throws", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readSeenCards(broken)).toEqual([]);
    expect(addSeenCard(broken, "mag")).toEqual(["mag"]);
    expect(readSeenCards(null)).toEqual([]);
  });
});

describe("pickCardIndex", () => {
  test("stays in range, and drops the biased values of the random source", () => {
    const seq = [4_294_967_295, 4_294_967_294, 7];
    let i = 0;
    expect(pickCardIndex(78, () => seq[i++]!)).toBe(7 % 78);
    for (let n = 0; n < 500; n += 1) {
      const index = pickCardIndex(78);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(78);
    }
  });

  test("covers the whole deck over many draws", () => {
    const seen = new Set<number>();
    for (let n = 0; n < 4000; n += 1) seen.add(pickCardIndex(78));
    expect(seen.size).toBe(78);
  });
});

describe("day card storage", () => {
  const now = new Date("2026-10-05T10:00:00Z");
  test("keeps today's card and forgets it the next day", () => {
    const storage = memory();
    expect(readDayCard(storage, now)).toBeNull();
    writeDayCard(storage, now, "mag");
    expect(readDayCard(storage, now)).toBe("mag");
    expect(readDayCard(storage, new Date("2026-10-06T10:00:00Z"))).toBeNull();
  });

  test("ignores garbage and survives a storage that throws", () => {
    const storage = memory();
    storage.setItem(TARO_DAY_KEY, "не json");
    expect(readDayCard(storage, now)).toBeNull();
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readDayCard(broken, now)).toBeNull();
    expect(() => writeDayCard(broken, now, "mag")).not.toThrow();
    expect(readDayCard(null, now)).toBeNull();
  });
});
