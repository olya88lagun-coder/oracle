import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { describe, expect, test } from "vitest";
import * as copy from "./moon-place-copy";

describe("placeNoteFor", () => {
  test("is null when the local date equals the server date", () => {
    expect(copy.placeNoteFor("Новосибирск", "22 ноября 2026", "22 ноября 2026")).toBeNull();
  });

  test("names the city and the local day without the year when the dates differ", () => {
    expect(copy.placeNoteFor("Новосибирск", "22 ноября 2026", "23 ноября 2026")).toBe("Сейчас в городе Новосибирск — 23 ноября");
  });
});

test("all the picker and note texts contain none of FORBIDDEN_MOON_WORDS", () => {
  const all = (Object.values(copy) as unknown[]).filter((value): value is string => typeof value === "string").join(" ").toLowerCase();
  for (const word of FORBIDDEN_MOON_WORDS) expect(all, word).not.toContain(word);
});
