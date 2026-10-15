import { describe, expect, test } from "vitest";
import { normalizeQuery } from "./normalize";
import { buildCityIndex, searchCities } from "./search";
import { FIXTURE_CITIES } from "./fixture";

const index = buildCityIndex(FIXTURE_CITIES);
const names = (query: string) => searchCities(index, query).map((city) => city.name);

describe("normalizeQuery", () => {
  test("lowercases, treats ё as е and hyphens as spaces, and trims", () => {
    expect(normalizeQuery("  Ёлкино ")).toBe("елкино");
    expect(normalizeQuery("Ростов-на-Дону")).toBe("ростов на дону");
    expect(normalizeQuery("САНКТ—Петербург")).toBe("санкт петербург");
  });
});

describe("searchCities", () => {
  test("finds by the start of any word and ranks bigger cities first", () => {
    expect(names("новгород")).toEqual(["Нижний Новгород", "Великий Новгород"]);
    expect(names("моск")[0]).toBe("Москва");
  });

  test("ignores ё/е, case and hyphens", () => {
    expect(names("елкино")).toEqual(["Ёлкино"]);
    expect(names("РОСТОВ НА ДОНУ")).toEqual(["Ростов-на-Дону"]);
    expect(names("ростов-на")).toEqual(["Ростов-на-Дону"]);
  });

  test("returns homonyms with their region so the person can tell them apart", () => {
    const found = searchCities(index, "александров");
    expect(found.length).toBeGreaterThanOrEqual(2);
    expect(new Set(found.map((city) => `${city.name}|${city.region}`)).size).toBe(found.length);
  });

  test("returns nothing for an empty, one-letter or very long query, and respects the limit", () => {
    expect(names("")).toEqual([]);
    expect(names(" ")).toEqual([]);
    expect(names("м")).toEqual([]);
    expect(names("м".repeat(200))).toEqual([]);
    expect(searchCities(index, "са", 1)).toHaveLength(1);
  });

  test("every city carries coordinates in range and a valid-looking IANA zone", () => {
    for (const city of FIXTURE_CITIES) {
      expect(Math.abs(city.latitude)).toBeLessThanOrEqual(85);
      expect(Math.abs(city.longitude)).toBeLessThanOrEqual(180);
      expect(city.zone).toMatch(/^[A-Za-z_]+\/[A-Za-z_\/+-]+$/);
    }
  });
});
