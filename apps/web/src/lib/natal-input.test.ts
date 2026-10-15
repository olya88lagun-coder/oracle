import { describe, expect, test } from "vitest";
import type { City } from "@oracle/geo";
import { validateAll, validateNatalInput, type RawNatalInput } from "./natal-input";

const MOSCOW: City = {
  id: 524901,
  name: "Москва",
  region: "Москва",
  country: "Россия",
  latitude: 55.7558,
  longitude: 37.6173,
  zone: "Europe/Moscow",
  population: 10381222,
};

// «Сегодня» — параметр: 15 октября 2026, местное время
const TODAY = new Date(2026, 9, 15, 12, 0);

const DATE_EMPTY = "Укажите дату рождения";
const DATE_RANGE = "Дата должна быть между 1 января 1900 и сегодняшним днём";
const TIME_FORMAT = "Укажите время в формате ЧЧ:ММ";
const CITY_REQUIRED = "Выберите город из списка";

const valid = (overrides: Partial<RawNatalInput> = {}): RawNatalInput => ({ date: "1990-03-07", time: "12:00", unknownTime: false, city: MOSCOW, ...overrides });
const failure = (raw: RawNatalInput) => {
  const result = validateNatalInput(raw, TODAY);
  if (result.ok) throw new Error("expected a validation failure");
  return result;
};

describe("validateNatalInput: date", () => {
  test("an empty date asks for the date", () => {
    expect(failure(valid({ date: "" }))).toEqual({ ok: false, field: "date", message: DATE_EMPTY });
  });

  test("a non-existent or malformed date is reported as an unfilled date", () => {
    for (const date of ["2023-02-30", "2023-02-29", "1990-13-01", "1990-00-10", "1990-04-31", "07.03.1990", "abc", "1990-3-7", "20000-01-01"]) {
      expect(failure(valid({ date })), date).toEqual({ ok: false, field: "date", message: DATE_EMPTY });
    }
  });

  test("29 February exists only in leap years", () => {
    expect(validateNatalInput(valid({ date: "2024-02-29" }), TODAY).ok).toBe(true);
    expect(validateNatalInput(valid({ date: "1900-02-28" }), TODAY).ok).toBe(true);
    expect(failure(valid({ date: "1900-02-29" })).message).toBe(DATE_EMPTY); // 1900 — не високосный
  });

  test("before 1 January 1900 is out of range, 1 January 1900 itself is fine", () => {
    expect(failure(valid({ date: "1899-12-31" }))).toEqual({ ok: false, field: "date", message: DATE_RANGE });
    expect(validateNatalInput(valid({ date: "1900-01-01" }), TODAY).ok).toBe(true);
  });

  test("a future date is out of range, today is fine, whatever the time of day", () => {
    expect(failure(valid({ date: "2026-10-16" }))).toEqual({ ok: false, field: "date", message: DATE_RANGE });
    expect(failure(valid({ date: "2030-01-01" })).message).toBe(DATE_RANGE);
    for (const now of [new Date(2026, 9, 15, 0, 0), new Date(2026, 9, 15, 12, 0), new Date(2026, 9, 15, 23, 59, 59)]) {
      expect(validateNatalInput(valid({ date: "2026-10-15" }), now).ok).toBe(true);
      expect(validateNatalInput(valid({ date: "2026-10-16" }), now).ok).toBe(false);
    }
  });

  test("the range depends on the passed day, not on the clock of the machine", () => {
    expect(validateNatalInput(valid({ date: "2040-06-01" }), new Date(2040, 5, 1)).ok).toBe(true);
    expect(validateNatalInput(valid({ date: "2040-06-01" }), new Date(2040, 4, 31)).ok).toBe(false);
  });
});

describe("validateNatalInput: time", () => {
  test("a malformed time asks for the HH:MM format", () => {
    for (const time of ["25:00", "12:60", "7:5", "7:05", "07:5", "", " ", "12", "12:00:00", "ab:cd", "24:00", "-1:00"]) {
      expect(failure(valid({ time })), JSON.stringify(time)).toEqual({ ok: false, field: "time", message: TIME_FORMAT });
    }
  });

  test("valid times, midnight included (00:00 is a real time, not an empty field)", () => {
    for (const time of ["07:05", "23:59", "00:00", "12:00", "00:01"]) {
      const result = validateNatalInput(valid({ time }), TODAY);
      expect(result, time).toEqual({ ok: true, value: { date: "1990-03-07", time, city: MOSCOW } });
    }
  });

  test("an unknown time becomes null and the time field is ignored, even a malformed one", () => {
    for (const time of ["", "25:00", "garbage"]) {
      expect(validateNatalInput(valid({ time, unknownTime: true }), TODAY)).toEqual({ ok: true, value: { date: "1990-03-07", time: null, city: MOSCOW } });
    }
  });
});

describe("validateNatalInput: city and order of checks", () => {
  test("the city is required", () => {
    expect(failure(valid({ city: null }))).toEqual({ ok: false, field: "city", message: CITY_REQUIRED });
  });

  test("the first failing field wins: date, then time, then city", () => {
    expect(failure({ date: "", time: "25:00", unknownTime: false, city: null }).field).toBe("date");
    expect(failure({ date: "1990-03-07", time: "25:00", unknownTime: false, city: null }).field).toBe("time");
    expect(failure({ date: "1990-03-07", time: "12:00", unknownTime: false, city: null }).field).toBe("city");
    expect(failure({ date: "1990-03-07", time: "25:00", unknownTime: true, city: null }).field).toBe("city");
  });

  test("the returned city is the same object", () => {
    const result = validateNatalInput(valid(), TODAY);
    expect(result.ok && result.value.city).toBe(MOSCOW);
  });

  test("the input is not mutated", () => {
    const raw = Object.freeze(valid());
    expect(() => validateNatalInput(raw, TODAY)).not.toThrow();
  });
});

describe("validateAll", () => {
  test("every field's message at once (state 5 of the mockup)", () => {
    expect(validateAll({ date: "", time: "", unknownTime: false, city: null }, TODAY)).toEqual({ date: DATE_EMPTY, time: TIME_FORMAT, city: CITY_REQUIRED });
  });

  test("null for the fields that are fine", () => {
    expect(validateAll(valid(), TODAY)).toEqual({ date: null, time: null, city: null });
    expect(validateAll(valid({ date: "1899-12-31" }), TODAY)).toEqual({ date: DATE_RANGE, time: null, city: null });
  });

  test("an unknown time has no time message", () => {
    expect(validateAll({ date: "", time: "xx", unknownTime: true, city: null }, TODAY)).toEqual({ date: DATE_EMPTY, time: null, city: CITY_REQUIRED });
  });
});
