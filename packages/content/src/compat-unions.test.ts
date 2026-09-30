import { describe, expect, test } from "vitest";
import { ARCANA } from "./index";
import { checkCompatUnions } from "./compat-check";
import { COMPAT_UNIONS, compatUnionByNumber } from "./compat-unions";

describe("compat unions", () => {
  test("are all 22, named as the arcana and pass the checks", () => {
    const names = new Map(ARCANA.map((arcanum) => [arcanum.number, arcanum.name] as const));
    expect(checkCompatUnions(COMPAT_UNIONS, names)).toEqual([]);
    expect(compatUnionByNumber(7).name).toBe("Колесница");
  });

  test("throws for an unknown number", () => {
    expect(() => compatUnionByNumber(23)).toThrow();
  });
});
