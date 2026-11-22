import { describe, expect, test } from "vitest";
import { localFor, parsePlace, placeChoice, placeFromCity, placeKey, placeLabel, toPlace } from "./moon-place";

const CITY = { id: 1496747, name: "Новосибирск", region: "Новосибирская область", country: "Россия", latitude: 55.0415, longitude: 82.9346, zone: "Asia/Novosibirsk", population: 1_500_000 };

describe("parsePlace", () => {
  test("returns null for non-JSON, arrays, wrong types, latitude 999, longitude -999 and an unknown zone", () => {
    const bad = [null, "", "{", "[]", "42", '"x"', "null", '{"id":"1"}', JSON.stringify({ ...placeFromCity(CITY), latitude: 999 }), JSON.stringify({ ...placeFromCity(CITY), longitude: -999 }), JSON.stringify({ ...placeFromCity(CITY), zone: "Mars/Base" }), JSON.stringify({ ...placeFromCity(CITY), zone: 5 }), JSON.stringify({ ...placeFromCity(CITY), name: "" })];
    for (const raw of bad) expect(parsePlace(raw), String(raw)).toBeNull();
  });

  test("keeps a valid city", () => {
    const place = placeFromCity(CITY);
    expect(parsePlace(JSON.stringify(place))).toEqual(place);
  });

  test("keeps only the fields of a place, dropping extra ones from the record", () => {
    const parsed = parsePlace(JSON.stringify({ ...placeFromCity(CITY), population: 5, junk: true }));
    expect(Object.keys(parsed!).sort()).toEqual(["id", "latitude", "longitude", "name", "region", "zone"]);
  });
});

describe("helpers", () => {
  test("placeFromCity and toPlace carry the coordinates and the zone", () => {
    expect(toPlace(placeFromCity(CITY))).toEqual({ latitude: 55.0415, longitude: 82.9346, zone: "Asia/Novosibirsk" });
  });

  test("placeLabel and placeKey give Moscow for null", () => {
    expect(placeLabel(null)).toBe("Москва");
    expect(placeKey(null)).toBe("moscow");
    expect(placeLabel(placeFromCity(CITY))).toBe("Новосибирск");
    expect(placeKey(placeFromCity(CITY))).toBe("1496747");
  });
});

describe("localFor", () => {
  test("gives the recalculated value only when it was calculated for the chosen place", () => {
    const place = placeFromCity(CITY);
    expect(localFor(null, { key: "1496747", value: "x" })).toBeNull();
    expect(localFor(place, null)).toBeNull();
    expect(localFor(place, { key: "other", value: "x" })).toBeNull();
    expect(localFor(place, { key: "1496747", value: "x" })).toBe("x");
  });
});

describe("placeChoice", () => {
  test("choosing Moscow from the list resets the choice instead of storing a city", () => {
    expect(placeChoice({ ...CITY, id: 524901, name: "Москва", zone: "Europe/Moscow" })).toEqual({ kind: "reset" });
    expect(placeChoice({ ...CITY, id: 1, name: "Москва", zone: "Europe/Moscow" })).toEqual({ kind: "reset" });
  });

  test("another city in the Moscow zone is a normal choice", () => {
    expect(placeChoice({ ...CITY, id: 2, name: "Подольск", zone: "Europe/Moscow" })).toEqual({ kind: "place", place: expect.objectContaining({ id: 2, zone: "Europe/Moscow" }) });
  });

  test("a city with a zone this browser does not know is invalid, not stored", () => {
    expect(placeChoice({ ...CITY, zone: "Mars/Base" })).toEqual({ kind: "invalid" });
  });

  test("a normal city is stored with its coordinates and zone", () => {
    expect(placeChoice(CITY)).toEqual({ kind: "place", place: placeFromCity(CITY) });
  });
});
