import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, normalizeQuery } from "./normalize";
import type { City } from "./types";

export type CityIndex = { entries: readonly { city: City; words: string[]; full: string }[] };

export function buildCityIndex(cities: readonly City[]): CityIndex {
  const entries = [...cities]
    .sort((a, b) => b.population - a.population)
    .map((city) => {
      const full = normalizeQuery(city.name);
      return { city, full, words: full.split(" ") };
    });
  return { entries };
}

// Совпадение с началом названия — выше, с началом любого слова — ниже; внутри группы — крупные города первыми
export function searchCities(index: CityIndex, query: string, limit = 8): City[] {
  const needle = normalizeQuery(query);
  if (needle.length < MIN_QUERY_LENGTH || needle.length > MAX_QUERY_LENGTH) return [];
  const starts: City[] = [];
  const wordStarts: City[] = [];
  for (const { city, full, words } of index.entries) {
    if (full.startsWith(needle)) starts.push(city);
    else if (words.some((word) => word.startsWith(needle)) || full.includes(` ${needle}`)) wordStarts.push(city);
  }
  return [...starts, ...wordStarts].slice(0, limit);
}
