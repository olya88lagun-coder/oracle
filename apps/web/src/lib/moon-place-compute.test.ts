import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { loadMoonToday, loadRibbonData } from "./moon-place-compute";
import { placeFromCity } from "./moon-place";

const NOVOSIBIRSK = placeFromCity({ id: 1496747, name: "Новосибирск", region: "Новосибирская область", country: "Россия", latitude: 55.0415, longitude: 82.9346, zone: "Asia/Novosibirsk", population: 1_500_000 });

describe("moon-place-compute", () => {
  test("imports the heavy modules only dynamically", () => {
    const source = readFileSync(new URL("./moon-place-compute.ts", import.meta.url), "utf8");
    for (const module of ["./moon-today", "./moon-ribbon", "./lunar-calendar"]) {
      expect(source, module).not.toMatch(new RegExp(`^import (?!type )[^\n]*from "${module.replace(/\//g, "\/")}"`, "m"));
    }
    expect(source).toMatch(/import\("\.\/moon-today"\)/);
    expect(source).toMatch(/import\("\.\/moon-ribbon"\)/);
  });

  test("loadMoonToday for Novosibirsk returns the local date", async () => {
    const today = await loadMoonToday(NOVOSIBIRSK, new Date("2026-11-22T18:00:00Z"));
    expect(today.dateLabel).toBe("23 ноября 2026");
  });

  test("loadRibbonData returns the same shape as the server data, for the local date", async () => {
    const data = await loadRibbonData(NOVOSIBIRSK, new Date("2026-11-22T18:00:00Z"));
    expect(data.date).toBe("2026-11-23");
    expect(Object.keys(data).sort()).toEqual(["date", "discImage", "illumination", "lunarDay", "phase", "phaseName", "sign", "signName", "waxing"]);
  });
});
