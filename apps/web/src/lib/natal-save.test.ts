import type { City } from "@oracle/geo";
import { describe, expect, test, vi } from "vitest";
import type { IntentStorage } from "./matrix-save";
import type { NatalInput } from "./natal-input";
import {
  NATAL_PENDING_KEY,
  markNatalSaveIntent,
  natalSaveState,
  replacesOtherBirth,
  savedFromInput,
  sameBirth,
  savedProfileToInput,
  takeNatalSaveIntent,
  toBirthPlacePayload,
  type SavedBirth,
} from "./natal-save";

const TODAY = new Date(2026, 8, 24, 12, 0, 0);
const MOSCOW: City = { id: 524901, name: "Москва", region: "Москва", country: "Россия", latitude: 55.752, longitude: 37.6178, zone: "Europe/Moscow", population: 12_000_000 };
const INPUT: NatalInput = { date: "1990-03-07", time: "12:05", city: MOSCOW };
const SAVED: SavedBirth = { date: "1990-03-07", time: "12:05", place: { name: "Москва", latitude: 55.752, longitude: 37.6178, zone: "Europe/Moscow" } };

function memoryStorage(initial: Record<string, string> = {}): IntentStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const pending = (value: unknown) => memoryStorage({ [NATAL_PENDING_KEY]: JSON.stringify(value) });
const GOOD = { date: "1990-03-07", time: "12:05", city: { name: "Москва", latitude: 55.752, longitude: 37.6178, zone: "Europe/Moscow" } };

describe("markNatalSaveIntent and takeNatalSaveIntent", () => {
  test("round trip keeps date, time and the city fields and builds a synthetic City", () => {
    const storage = memoryStorage();

    markNatalSaveIntent(storage, INPUT);
    const taken = takeNatalSaveIntent(storage, TODAY);

    expect(taken).toEqual({
      date: "1990-03-07",
      time: "12:05",
      city: { id: 0, name: "Москва", region: "", country: "", latitude: 55.752, longitude: 37.6178, zone: "Europe/Moscow", population: 0 },
    });
  });

  test("stores only the five needed fields, as JSON under the one key", () => {
    const storage = memoryStorage();

    markNatalSaveIntent(storage, INPUT);

    expect([...storage.data.keys()]).toEqual(["oracle-natal-pending"]);
    expect(JSON.parse(storage.data.get(NATAL_PENDING_KEY) as string)).toEqual(GOOD);
  });

  test("keeps an unknown time as null", () => {
    const storage = memoryStorage();

    markNatalSaveIntent(storage, { ...INPUT, time: null });

    expect(takeNatalSaveIntent(storage, TODAY)?.time).toBeNull();
  });

  test("removes the key on every read: after a good entry, a bad one and a missing one", () => {
    const good = pending(GOOD);
    const bad = memoryStorage({ [NATAL_PENDING_KEY]: "{not json" });
    const empty = memoryStorage();

    takeNatalSaveIntent(good, TODAY);
    takeNatalSaveIntent(bad, TODAY);
    takeNatalSaveIntent(empty, TODAY);

    expect(good.data.has(NATAL_PENDING_KEY)).toBe(false);
    expect(bad.data.has(NATAL_PENDING_KEY)).toBe(false);
    expect(takeNatalSaveIntent(good, TODAY)).toBeNull();
  });

  test.each<[string, unknown]>([
    ["a string", "Москва"],
    ["null", null],
    ["an array", [GOOD]],
    ["no city", { date: GOOD.date, time: GOOD.time }],
    ["a city that is a string", { ...GOOD, city: "Москва" }],
    ["an impossible date", { ...GOOD, date: "1990-02-30" }],
    ["a future date", { ...GOOD, date: "2027-01-01" }],
    ["a date before 1900", { ...GOOD, date: "1899-12-31" }],
    ["a numeric date", { ...GOOD, date: 19900307 }],
    ["24:00", { ...GOOD, time: "24:00" }],
    ["a missing time", { date: GOOD.date, city: GOOD.city }],
    ["an empty name", { ...GOOD, city: { ...GOOD.city, name: "" } }],
    ["a name with a newline", { ...GOOD, city: { ...GOOD.city, name: "Мос\nква" } }],
    ["a 121-character name", { ...GOOD, city: { ...GOOD.city, name: "а".repeat(121) } }],
    ["string coordinates", { ...GOOD, city: { ...GOOD.city, latitude: "55.7" } }],
    ["latitude 86", { ...GOOD, city: { ...GOOD.city, latitude: 86 } }],
    ["longitude 181", { ...GOOD, city: { ...GOOD.city, longitude: 181 } }],
    ["a null latitude (NaN after JSON)", { ...GOOD, city: { ...GOOD.city, latitude: null } }],
    ["a missing zone", { ...GOOD, city: { name: "Москва", latitude: 55, longitude: 37 } }],
    ["a zone with spaces", { ...GOOD, city: { ...GOOD.city, zone: "Europe Moscow" } }],
    ["a 65-character zone", { ...GOOD, city: { ...GOOD.city, zone: "A".repeat(65) } }],
  ])("returns null for %s", (_name, value) => {
    expect(takeNatalSaveIntent(pending(value), TODAY)).toBeNull();
  });

  test("never throws when the storage does", () => {
    const throwing: IntentStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const readOnly: IntentStorage = { getItem: () => JSON.stringify(GOOD), setItem: vi.fn(), removeItem: () => { throw new Error("blocked"); } };

    expect(() => markNatalSaveIntent(throwing, INPUT)).not.toThrow();
    expect(takeNatalSaveIntent(throwing, TODAY)).toBeNull();
    expect(() => takeNatalSaveIntent(readOnly, TODAY)).not.toThrow();
    expect(takeNatalSaveIntent(null, TODAY)).toBeNull();
    expect(() => markNatalSaveIntent(null, INPUT)).not.toThrow();
  });
});

describe("toBirthPlacePayload", () => {
  test("is exactly the six fields of the request body and nothing from the rest of the city", () => {
    expect(toBirthPlacePayload(INPUT)).toEqual({ birthDate: "1990-03-07", time: "12:05", name: "Москва", latitude: 55.752, longitude: 37.6178, zone: "Europe/Moscow" });
    expect(toBirthPlacePayload({ ...INPUT, time: null }).time).toBeNull();
  });
});

describe("savedProfileToInput", () => {
  test("builds a synthetic City with id 0 and empty region, country and population", () => {
    const input = savedProfileToInput({ ...SAVED, place: SAVED.place! });

    expect(input).toEqual({ date: "1990-03-07", time: "12:05", city: { id: 0, name: "Москва", region: "", country: "", latitude: 55.752, longitude: 37.6178, zone: "Europe/Moscow", population: 0 } });
  });
});

describe("savedFromInput", () => {
  test("keeps only date, time, name, coordinates and zone, and equals the input afterwards", () => {
    const saved = savedFromInput(INPUT);

    expect(saved).toEqual(SAVED);
    expect(sameBirth(saved, INPUT)).toBe(true);
  });
});

describe("sameBirth", () => {
  test("is true for the stored data, even when the city comes from the base with extra fields", () => {
    expect(sameBirth(SAVED, INPUT)).toBe(true);
  });

  test("rounds coordinates to four decimals", () => {
    expect(sameBirth(SAVED, { ...INPUT, city: { ...MOSCOW, latitude: 55.752 + 0.00001 } })).toBe(true);
    expect(sameBirth(SAVED, { ...INPUT, city: { ...MOSCOW, latitude: 55.7525 } })).toBe(false);
  });

  test.each<[string, Partial<NatalInput>]>([
    ["another date", { date: "1990-03-08" }],
    ["another time", { time: "12:06" }],
    ["an unknown time", { time: null }],
    ["another name", { city: { ...MOSCOW, name: "Мытищи" } }],
    ["another zone", { city: { ...MOSCOW, zone: "Europe/Samara" } }],
    ["another longitude", { city: { ...MOSCOW, longitude: 38 } }],
  ])("is false for %s", (_name, patch) => {
    expect(sameBirth(SAVED, { ...INPUT, ...patch })).toBe(false);
  });

  test("is false without a stored place, a stored profile or an input", () => {
    expect(sameBirth(null, INPUT)).toBe(false);
    expect(sameBirth({ ...SAVED, place: null }, INPUT)).toBe(false);
    expect(sameBirth(SAVED, null)).toBe(false);
  });
});

describe("replacesOtherBirth", () => {
  test("is false when nothing is stored or the same data is stored", () => {
    expect(replacesOtherBirth(null, INPUT)).toBe(false);
    expect(replacesOtherBirth(SAVED, INPUT)).toBe(false);
  });

  test("is true when the portrait holds another place, time or date", () => {
    expect(replacesOtherBirth(SAVED, { ...INPUT, time: null })).toBe(true);
    expect(replacesOtherBirth(SAVED, { ...INPUT, date: "1991-01-01" })).toBe(true);
    expect(replacesOtherBirth({ date: "1991-01-01", time: null, place: null }, INPUT)).toBe(true);
  });

  test("is false for a date-only portrait with the same date: nothing but the place is added", () => {
    expect(replacesOtherBirth({ date: "1990-03-07", time: null, place: null }, INPUT)).toBe(false);
  });
});

describe("natalSaveState", () => {
  const base = { signedIn: true, saved: null, input: INPUT, status: "idle" as const };

  test("guest when not signed in", () => {
    expect(natalSaveState({ ...base, signedIn: false })).toBe("guest");
  });

  test("offer when signed in and the portrait differs or is empty", () => {
    expect(natalSaveState(base)).toBe("offer");
    expect(natalSaveState({ ...base, saved: { ...SAVED, time: null } })).toBe("offer");
  });

  test("saved when the stored profile equals the current input", () => {
    expect(natalSaveState({ ...base, saved: SAVED })).toBe("saved");
  });

  test("saving and error take precedence", () => {
    expect(natalSaveState({ ...base, status: "saving" })).toBe("saving");
    expect(natalSaveState({ ...base, status: "error", saved: SAVED })).toBe("error");
    expect(natalSaveState({ ...base, signedIn: false, status: "saving" })).toBe("saving");
  });
});
