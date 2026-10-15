import data from "../data/cities.json";
import type { City } from "./types";

export * from "./types";
export * from "./normalize";
export * from "./search";

// Файл хранит города компактно: строки-массивы и общие списки зон, стран и регионов (см. README и scripts/build-cities.mjs)
type CitiesFile = {
  zones: string[];
  countries: string[];
  regions: string[];
  rows: [number, string, number, number, number, number, number, number][];
};

const file = data as CitiesFile;

export const CITIES: readonly City[] = file.rows.map(([id, name, region, country, latitude, longitude, zone, population]) => ({
  id,
  name,
  region: file.regions[region] ?? "",
  country: file.countries[country] ?? "",
  latitude,
  longitude,
  zone: file.zones[zone] ?? "",
  population,
}));
