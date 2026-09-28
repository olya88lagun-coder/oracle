import { describe, expect, test } from "vitest";
import { buildChapterInputs, buildScenarioInput } from "./input";
import { buildPrompt } from "./prompt";
import { EXAMPLE_MATRIX, proseAnswer, SCENARIO_ANSWER } from "./testing";
import { validateChapter } from "./validate";

const core = buildChapterInputs(EXAMPLE_MATRIX)[0]!;
const scenario = buildScenarioInput(EXAMPLE_MATRIX, []);

describe("validateChapter", () => {
  test("accepts prose wrapped in a code fence and trims it", () => {
    const result = validateChapter(core, "```json\n" + proseAnswer() + "\n```");

    expect(result.ok && result.chapter.id).toBe("core");
    expect(result.ok && result.chapter.source).toBe("ai");
    expect(result.ok && result.chapter.paragraphs).toHaveLength(4);
  });

  test.each([
    ["not json", "просто текст", "not_json"],
    ["no paragraphs", JSON.stringify({ text: "…" }), "schema"],
    ["an empty paragraph", JSON.stringify({ paragraphs: ["a", " ", "b"] }), "schema"],
    ["two paragraphs", proseAnswer(2, 8), "length"],
    ["too short", proseAnswer(3, 2), "length"],
    ["too long", proseAnswer(5, 6), "length"],
    ["a stop phrase", JSON.stringify({ paragraphs: ["Вам суждено. " + "а".repeat(500), "б".repeat(500), "в".repeat(500)] }), "stop_words"],
  ])("rejects prose with %s", (_case, raw, reason) => {
    expect(validateChapter(core, raw)).toEqual({ ok: false, reason });
  });

  test("accepts the seven scenario fields", () => {
    const result = validateChapter(scenario, SCENARIO_ANSWER);

    expect(result.ok && result.chapter.scenario?.question).toBe("Где я держу себя сильнее, чем нужно?");
  });

  test.each([
    ["a missing field", { ...JSON.parse(SCENARIO_ANSWER), blindSpot: undefined }, "schema"],
    ["a question without a question mark", { ...JSON.parse(SCENARIO_ANSWER), question: "Подумайте об этом." }, "schema"],
    ["an over-long field", { ...JSON.parse(SCENARIO_ANSWER), pattern: "а".repeat(701) }, "length"],
  ])("rejects a scenario with %s", (_case, value, reason) => {
    expect(validateChapter(scenario, JSON.stringify(value))).toEqual({ ok: false, reason });
  });
});

describe("buildPrompt", () => {
  test("sends the rules in system and only the chapter input in user", () => {
    const prompt = buildPrompt(core);

    expect(prompt.system).toMatch(/на «вы»/);
    expect(prompt.system).toMatch(/paragraphs/);
    expect(JSON.parse(prompt.user)).toEqual(core);
    expect(buildPrompt(scenario).system).toMatch(/blindSpot/);
  });
});
