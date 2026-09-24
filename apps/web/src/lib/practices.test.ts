import { describe, expect, test } from "vitest";
import { PRACTICES } from "./practices";

describe("PRACTICES", () => {
  test("lists the four practices of the spec in launch order", () => {
    expect(PRACTICES.map((practice) => practice.slug)).toEqual(["matrix", "lila", "tarot", "natal"]);
  });

  test("every practice has a title and a one-sentence summary", () => {
    for (const practice of PRACTICES) {
      expect(practice.title.length).toBeGreaterThan(0);
      expect(practice.summary).toMatch(/^\S.+\.$/);
    }
  });
});
