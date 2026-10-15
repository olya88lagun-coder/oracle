import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isValidZone } from "@oracle/core/natal";
import { describe, expect, test } from "vitest";
import { buildCityIndex, searchCities } from "./search";
import { CITIES } from "./index";

const DATA_FILE = fileURLToPath(new URL("../data/cities.json", import.meta.url));
const MAX_DATA_BYTES = 6 * 1024 * 1024;
const byName = (name: string) => CITIES.find((city) => city.name === name);

describe("city database", () => {
  test.each(["Москва", "Новосибирск", "Мурманск", "Анадырь", "Владивосток", "Калининград", "Екатеринбург"])("has %s under its Russian name", (name) => {
    expect(byName(name)).toBeDefined();
  });

  test("has no duplicate ids and every zone is a valid IANA zone", () => {
    expect(new Set(CITIES.map((city) => city.id)).size).toBe(CITIES.length);
    const zones = new Set(CITIES.map((city) => city.zone));
    expect([...zones].filter((zone) => !isValidZone(zone))).toEqual([]);
  });

  test("every city has a name, a country and coordinates in range", () => {
    for (const city of CITIES) {
      expect(city.name).not.toBe("");
      expect(city.country).not.toBe("");
      expect(Math.abs(city.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(city.longitude)).toBeLessThanOrEqual(180);
    }
  });

  test("is sorted by population, biggest first", () => {
    for (let i = 1; i < CITIES.length; i += 1) expect(CITIES[i - 1]!.population).toBeGreaterThanOrEqual(CITIES[i]!.population);
  });

  test("keeps the file compact", () => {
    expect(statSync(DATA_FILE).size).toBeLessThan(MAX_DATA_BYTES);
  });

  test("Moscow is in the Moscow zone and Murmansk lies beyond the Arctic circle", () => {
    expect(byName("Москва")?.zone).toBe("Europe/Moscow");
    expect(byName("Москва")?.country).toBe("Россия");
    expect(byName("Мурманск")?.latitude).toBeGreaterThan(66.5);
  });

  test("is searchable by the Russian name", () => {
    const index = buildCityIndex(CITIES);
    expect(searchCities(index, "моск")[0]?.name).toBe("Москва");
    expect(searchCities(index, "анадыр").map((city) => city.name)).toContain("Анадырь");
  });
});
