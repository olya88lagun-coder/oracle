import { ARCANA_COUNT } from "@oracle/core";
import { describe, expect, test } from "vitest";
import raw from "./generated/arcana.json";
import { ARCANA, arcanumByNumber, arcanumBySlug, checkArcana, loadArcana } from "./index";

describe("published arcana", () => {
  test("all 22 arcana are present, well-formed and free of stop phrases", () => {
    expect(checkArcana(loadArcana(raw as Record<string, string>))).toEqual([]);
  });

  test("are sorted by number and can be looked up by number and slug", () => {
    expect(ARCANA.map((arcanum) => arcanum.number)).toEqual(Array.from({ length: ARCANA_COUNT }, (_, i) => i + 1));
    expect(arcanumByNumber(11).slug).toBe("sila");
    expect(arcanumBySlug("shut")?.number).toBe(22);
    expect(arcanumBySlug("nope")).toBeUndefined();
    expect(() => arcanumByNumber(23)).toThrow(/23/);
  });
});
