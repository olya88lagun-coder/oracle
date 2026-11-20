import { describe, expect, test } from "vitest";
import { moonPosterSpec } from "./poster-moon";
import { buildMoonToday } from "./moon-today";

const today = buildMoonToday(new Date("2026-11-20T09:00:00Z"));
const spec = moonPosterSpec(today);

describe("moonPosterSpec", () => {
  test("carries the phase, the sign, the lunar day and the rise and set of the day, with the grammar of the day number", () => {
    expect(spec.title).toBe("Луна сегодня");
    expect(spec.dateLabel).toBe("20 ноября 2026");
    expect(spec.phaseName).toBe("Растущая Луна");
    expect(spec.signLine).toMatch(/^Луна (в|во) [А-Яа-я]+$/);
    expect(spec.dayLine).toBe("11-е лунные сутки");
    expect(spec.rise).toMatch(/^\d\d:\d\d$/);
    expect(spec.set).toMatch(/^\d\d:\d\d$/);
  });

  test("the disc follows the real illumination, and the sign picture is the engraving of the Moon's sign", () => {
    expect(spec.illumination).toBeGreaterThan(0.7);
    expect(spec.illumination).toBeLessThan(0.95);
    expect(spec.waxing).toBe(true);
    expect(spec.signImage).toMatch(/^\/luna\/signs\/[a-z]+\.webp$/);
  });

  test("the file name and the footer are fixed, and the spec holds no personal data: only values shared by everyone", () => {
    expect(spec.fileName).toBe("luna-segodnya");
    expect(spec.footer).toBe("ТВОЙ ОРАКУЛ · TVOY-ORAKUL.RU");
    expect(Object.keys(spec).sort()).toEqual(["dateLabel", "dayLine", "fileName", "footer", "illumination", "moon", "phaseName", "rise", "set", "signImage", "signLine", "title", "waxing"]);
  });

  test("the spec is plain data that can cross from the server page to the button", () => {
    expect(JSON.parse(JSON.stringify(spec))).toEqual(spec);
  });
});
