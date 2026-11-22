import { describe, expect, test } from "vitest";
import { parsePlace, placeFromCity, placeKey, placeLabel, toPlace } from "./moon-place";

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
