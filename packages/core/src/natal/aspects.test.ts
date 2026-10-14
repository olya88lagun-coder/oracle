import { describe, expect, test } from "vitest";
import { findAspects } from "./aspects";
import { BODIES, type BodyId } from "./bodies";

// Все тела разнесены далеко друг от друга, затем нужные двигаем в тест
const spread = (overrides: Partial<Record<BodyId, number>>): Record<BodyId, number> =>
  ({ ...Object.fromEntries(BODIES.map((body, index) => [body, 5 + index * 31.7])), ...overrides }) as Record<BodyId, number>;

describe("findAspects", () => {
  test("finds a conjunction of the luminaries within 8° and nothing beyond", () => {
    const near = findAspects(spread({ sun: 100, moon: 107.9 }), ["sun", "moon"]);
    expect(near).toHaveLength(1);
    expect(near[0]).toMatchObject({ a: "sun", b: "moon", aspect: "conjunction" });
    expect(near[0]!.orb).toBeCloseTo(7.9, 6);
    expect(findAspects(spread({ sun: 100, moon: 108.1 }), ["sun", "moon"])).toEqual([]);
  });

  test("uses 6° for two slow planets", () => {
    expect(findAspects(spread({ uranus: 10, neptune: 15.9 }), ["uranus", "neptune"])).toHaveLength(1);
    expect(findAspects(spread({ uranus: 10, neptune: 16.1 }), ["uranus", "neptune"])).toEqual([]);
  });

  test("measures across 0°/360° and recognises an opposition", () => {
    const found = findAspects(spread({ mars: 350, venus: 170 }), ["mars", "venus"]);
    expect(found).toEqual([{ a: "mars", b: "venus", aspect: "opposition", orb: 0 }]);
  });

  test("finds trine, square and sextile and sorts the tightest first", () => {
    const found = findAspects(spread({ sun: 0, moon: 92, mercury: 121, venus: 59 }), ["sun", "moon", "mercury", "venus"]);
    const keys = found.map((item) => `${item.a}-${item.b}:${item.aspect}`);
    expect(keys).toContain("sun-moon:square");
    expect(keys).toContain("sun-mercury:trine");
    expect(keys).toContain("sun-venus:sextile");
    expect(found.map((item) => item.orb)).toEqual([...found.map((item) => item.orb)].sort((x, y) => x - y));
  });
});
