import { describe, expect, test } from "vitest";
import { FRESH_KEY, lastDays, MAX_VISITS, parseFresh, parseRewards, parseVisits, readVisitState, recordVisit, REWARDS_KEY, REWARD_STEPS, visitStreak, VISITS_KEY } from "./moon-visit";
import { SEEN_KEY } from "./moon-collection";

const memory = (init: Record<string, string> = {}) => {
  const map = new Map(Object.entries(init));
  return { map, getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => void map.set(key, value) };
};
const broken = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
const at = (iso: string) => new Date(`${iso}T09:00:00Z`);

describe("parsers", () => {
  test("parseVisits drops junk and duplicates, sorts, and keeps the last 120", () => {
    expect(parseVisits('["2026-11-02","2026-11-01","2026-11-02","nope",5,"2026-13-45"]')).toEqual(["2026-11-01", "2026-11-02"]);
    const many = JSON.stringify(Array.from({ length: 300 }, (_, index) => new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10)));
    const kept = parseVisits(many);
    expect(kept).toHaveLength(MAX_VISITS);
    expect(kept.at(-1)).toBe(new Date(Date.UTC(2026, 0, 300)).toISOString().slice(0, 10));
  });

  test("every parser returns an empty state for non-JSON, wrong shapes and numbers", () => {
    for (const raw of [null, "", "{", "[1,2,3]", "42", '"text"', '{"a":1}']) {
      expect(parseVisits(raw)).toEqual([]);
      expect(parseRewards(raw)).toEqual({ steps: [], best: 0 });
      expect(parseFresh(raw, "2026-11-22")).toEqual([]);
    }
  });

  test("parseRewards keeps only known steps and a sane best", () => {
    expect(parseRewards('{"steps":[7,3,99,"x",7],"best":9}')).toEqual({ steps: [3, 7], best: 9 });
    expect(parseRewards('{"steps":[3],"best":-4}')).toEqual({ steps: [3], best: 0 });
  });

  test("parseFresh returns ids only for today and only known engravings", () => {
    const raw = JSON.stringify({ date: "2026-11-22", ids: ["sign:aries", "phase:full", "junk"] });
    expect(parseFresh(raw, "2026-11-22")).toEqual(["sign:aries", "phase:full"]);
    expect(parseFresh(raw, "2026-11-23")).toEqual([]);
  });
});

describe("visitStreak and lastDays", () => {
  test("counts back from today, from yesterday when today is missing, and tracks the best run", () => {
    expect(visitStreak(["2026-11-20", "2026-11-21", "2026-11-22"], "2026-11-22")).toEqual({ current: 3, best: 3 });
    expect(visitStreak(["2026-11-19", "2026-11-20", "2026-11-21"], "2026-11-22")).toEqual({ current: 3, best: 3 });
    expect(visitStreak(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-22"], "2026-11-22")).toEqual({ current: 1, best: 4 });
    expect(visitStreak([], "2026-11-22")).toEqual({ current: 0, best: 0 });
  });

  test("dates from the future neither extend nor break the streak", () => {
    expect(visitStreak(["2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24"], "2026-11-22")).toEqual({ current: 2, best: 2 });
  });

  test("lastDays returns 14 ISO dates ending today across a month boundary", () => {
    const days = lastDays("2026-12-03", 14);
    expect(days).toHaveLength(14);
    expect(days[0]).toBe("2026-11-20");
    expect(days.at(-1)).toBe("2026-12-03");
  });
});

describe("recordVisit", () => {
  test("is idempotent within a day: the streak, fresh ids and rewards do not change on a second call", () => {
    const storage = memory();
    const first = recordVisit(storage, at("2026-11-22"), ["sign:aries", "phase:full"]);
    const second = recordVisit(storage, at("2026-11-22"), ["sign:aries", "phase:full"]);
    expect(first.visits).toEqual(["2026-11-22"]);
    expect(first.fresh).toEqual(["sign:aries", "phase:full"]);
    expect(second.visits).toEqual(first.visits);
    expect(second.fresh).toEqual(first.fresh);
    expect(second.seen).toEqual(first.seen);
    expect(second.streak).toEqual({ current: 1, best: 1 });
    expect(second.newRewards).toEqual([]);
  });

  test("splits days at Moscow midnight, not at UTC midnight", () => {
    const storage = memory();
    recordVisit(storage, new Date("2026-11-22T20:59:00Z"), []);
    const next = recordVisit(storage, new Date("2026-11-22T21:01:00Z"), []);
    expect(next.today).toBe("2026-11-23");
    expect(next.visits).toEqual(["2026-11-22", "2026-11-23"]);
    expect(next.streak.current).toBe(2);
  });

  test("keeps fresh ids only for today and merges new ones without duplicates", () => {
    const storage = memory({ [FRESH_KEY]: JSON.stringify({ date: "2026-11-21", ids: ["sign:leo"] }) });
    const first = recordVisit(storage, at("2026-11-22"), ["sign:aries"]);
    expect(first.fresh).toEqual(["sign:aries"]);
    const again = recordVisit(storage, at("2026-11-22"), ["sign:aries", "phase:full"]);
    expect(again.fresh).toEqual(["sign:aries", "phase:full"]);
    expect(JSON.parse(storage.map.get(SEEN_KEY)!)).toEqual(expect.arrayContaining(["sign:aries", "phase:full"]));
  });

  test("rewards are earned at 3, 7, 14 and 30 days and stay earned after the streak breaks", () => {
    expect(REWARD_STEPS).toEqual([3, 7, 14, 30]);
    const days = ["2026-11-10", "2026-11-11"];
    const storage = memory({ [VISITS_KEY]: JSON.stringify(days) });
    const third = recordVisit(storage, at("2026-11-12"), []);
    expect(third.rewards).toEqual([3]);
    expect(third.newRewards).toEqual([3]);
    const later = recordVisit(storage, at("2026-11-20"), []);
    expect(later.streak.current).toBe(1);
    expect(later.streak.best).toBe(3);
    expect(later.rewards).toEqual([3]);
    expect(later.newRewards).toEqual([]);
    expect(JSON.parse(storage.map.get(REWARDS_KEY)!).steps).toEqual([3]);
  });

  test("survives storage that throws: no visits, no exception, engravings still unlocked for this session", () => {
    const state = recordVisit(broken, at("2026-11-22"), ["sign:aries"]);
    expect(state.visits).toEqual([]);
    expect(state.streak).toEqual({ current: 0, best: 0 });
    expect(state.rewards).toEqual([]);
    expect(state.seen).toEqual(["sign:aries"]);
    expect(recordVisit(null, at("2026-11-22"), []).visits).toEqual([]);
  });

  test("drops future dates when recording", () => {
    const storage = memory({ [VISITS_KEY]: JSON.stringify(["2026-11-21", "2026-12-30"]) });
    const state = recordVisit(storage, at("2026-11-22"), []);
    expect(state.visits).toEqual(["2026-11-21", "2026-11-22"]);
    expect(state.streak.current).toBe(2);
  });
});

describe("readVisitState", () => {
  test("reads without writing and reports today's fresh engravings", () => {
    const storage = memory({ [VISITS_KEY]: JSON.stringify(["2026-11-21", "2026-11-22"]), [FRESH_KEY]: JSON.stringify({ date: "2026-11-22", ids: ["sign:aries"] }) });
    const before = new Map(storage.map);
    const state = readVisitState(storage, at("2026-11-22"));
    expect(state.streak.current).toBe(2);
    expect(state.fresh).toEqual(["sign:aries"]);
    expect(state.newRewards).toEqual([]);
    expect(storage.map).toEqual(before);
    expect(readVisitState(broken, at("2026-11-22")).visits).toEqual([]);
  });
});
