import { describe, expect, test } from "vitest";
import { COLLECTION_IDS, nextOpening, openedBy, parseSeen, unlock } from "./moon-collection";

describe("collection", () => {
  test("has 12 signs and 8 phases, 20 pictures in all, without repeats", () => {
    expect(COLLECTION_IDS).toHaveLength(20);
    expect(new Set(COLLECTION_IDS).size).toBe(20);
  });

  test("parseSeen keeps only the known pictures and drops repeats, and gives an empty list for a broken value", () => {
    expect(parseSeen(JSON.stringify(["sign:leo", "phase:full", "sign:leo", "sign:ophiuchus", 5, "x"]))).toEqual(["sign:leo", "phase:full"]);
    for (const raw of [null, "", "{", '{"a":1}', "null"]) expect(parseSeen(raw), String(raw)).toEqual([]);
  });

  test("a day opens the picture of its sign and of its phase", () => {
    expect(openedBy("aries", "waxingGibbous")).toEqual(["sign:aries", "phase:waxingGibbous"]);
  });

  test("unlock reports only the pictures that were closed before, once each", () => {
    expect(unlock(["sign:leo"], ["sign:leo", "phase:full"])).toEqual({ seen: ["sign:leo", "phase:full"], fresh: ["phase:full"] });
    expect(unlock([], ["sign:leo", "sign:leo"])).toEqual({ seen: ["sign:leo"], fresh: ["sign:leo"] });
    expect(unlock(["sign:leo", "phase:full"], ["sign:leo", "phase:full"]).fresh).toEqual([]);
  });

  test("nextOpening finds the nearest day not before today that opens the picture, or null when the month has none", () => {
    const days = [
      { date: "2026-11-19", sign: "pisces", phase: "waxingGibbous" },
      { date: "2026-11-20", sign: "aries", phase: "waxingGibbous" },
      { date: "2026-11-23", sign: "taurus", phase: "waxingGibbous" },
      { date: "2026-11-24", sign: "taurus", phase: "full" },
    ] as const;
    expect(nextOpening("sign:taurus", days, "2026-11-20")).toBe("2026-11-23");
    expect(nextOpening("phase:full", days, "2026-11-20")).toBe("2026-11-24");
    expect(nextOpening("sign:pisces", days, "2026-11-20")).toBeNull();
    expect(nextOpening("sign:leo", days, "2026-11-20")).toBeNull();
  });
});
