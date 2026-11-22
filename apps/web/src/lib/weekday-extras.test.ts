import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";
import { weekdayPosterSpec } from "./poster-weekday";
import { WEEKDAY_PLANETS } from "./weekday-planets";

test("every day has a short action and an etymology line, with no promises or day ratings", () => {
  for (const planet of WEEKDAY_PLANETS) {
    expect(planet.action.length).toBeGreaterThan(30);
    expect(planet.action.length).toBeLessThanOrEqual(170);
    expect(planet.etymology.length).toBeGreaterThan(20);
    const text = `${planet.action} ${planet.etymology}`.toLowerCase();
    for (const word of ["благоприятн", "удачн", "гарантир", "обязательно", "здоровь", "деньг"]) expect(text).not.toContain(word);
  }
});

test("story poster spec carries only the public text and points at an existing artwork", () => {
  for (const planet of WEEKDAY_PLANETS) {
    const spec = weekdayPosterSpec(planet);
    expect(spec.image).toBe(`/images/weekday/${planet.glyph}-768.webp`);
    expect(existsSync(path.resolve(__dirname, "../../public", spec.image.slice(1)))).toBe(true);
    expect(spec.question).toBe(planet.question);
    expect(spec.subtitle).toBe(`День ${planet.planetGenitive}`);
  }
});
