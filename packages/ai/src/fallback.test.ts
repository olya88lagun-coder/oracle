import { expect, test } from "vitest";
import { fallbackChapter } from "./fallback";
import { buildChapterInputs, buildScenarioInput } from "./input";
import { EXAMPLE_MATRIX } from "./testing";

test("a repeated arcanum block is not copied word for word into a later chapter", () => {
  const chapters = buildChapterInputs(EXAMPLE_MATRIX).map(fallbackChapter);
  const paragraphs = chapters.flatMap((chapter) => chapter.paragraphs ?? []).filter((text) => text.length > 120);
  expect(new Set(paragraphs).size).toBe(paragraphs.length);
});

test("the scenario fallback keeps quoted phrases out of the middle of a sentence", () => {
  const scenario = fallbackChapter(buildScenarioInput(EXAMPLE_MATRIX, [])).scenario!;
  expect(scenario.tension).toMatch(/^Напряжение возникает между двумя полюсами центра\. Опора — «/);
  expect(scenario.turningPoint).toContain("к опоре: «");
});
