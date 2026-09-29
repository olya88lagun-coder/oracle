import { describe, expect, test } from "vitest";
import { buildChapterInputs, buildScenarioInput } from "./input";
import { buildPrompt } from "./prompt";
import { EXAMPLE_MATRIX, proseAnswer, SCENARIO_ANSWER } from "./testing";
import { describeAnswer, validateChapter } from "./validate";

const core = buildChapterInputs(EXAMPLE_MATRIX)[0]!;
const scenario = buildScenarioInput(EXAMPLE_MATRIX, []);

describe("validateChapter", () => {
  test("accepts prose wrapped in a code fence and trims it", () => {
    const result = validateChapter(core, "```json\n" + proseAnswer() + "\n```");

    expect(result.ok && result.chapter.id).toBe("core");
    expect(result.ok && result.chapter.source).toBe("ai");
    expect(result.ok && result.chapter.paragraphs).toHaveLength(4);
  });

  test("accepts paragraphs that contain raw line breaks and tabs inside the JSON strings", () => {
    const paragraph = "а".repeat(200);
    const raw = `{"paragraphs": ["${paragraph}\n${paragraph}", "${"б".repeat(300)}\t${"б".repeat(300)}", "${"в".repeat(400)}"]}`;

    const result = validateChapter(core, raw);

    expect(result.ok && result.chapter.paragraphs).toEqual([`${paragraph}\n${paragraph}`, `${"б".repeat(300)}\t${"б".repeat(300)}`, "в".repeat(400)]);
  });

  test("keeps escaped quotes and backslashes while repairing line breaks", () => {
    const raw = `{"paragraphs": ["${"а".repeat(400)} \\"цитата\\" и слеш \\\\\n${"а".repeat(400)}", "${"б".repeat(400)}", "${"в".repeat(400)}"]}`;

    const result = validateChapter(core, raw);

    expect(result.ok && result.chapter.paragraphs?.[0]).toContain('"цитата" и слеш \\');
  });

  test("describes a rejected answer by size and edges without keeping the text", () => {
    const facts = describeAnswer(proseAnswer(2, 8));

    expect(facts).toMatchObject({ paragraphs: 2, textChars: expect.any(Number), chars: expect.any(Number) });
    expect(String(facts.head).length).toBeLessThanOrEqual(16);
    expect(describeAnswer("просто текст")).toEqual({ chars: 12, head: "просто текст", tail: "просто текст", paragraphs: 1, textChars: 12 });
  });

  test("accepts plain text paragraphs separated by blank lines, with the model's own quotes", () => {
    const first = `Аркан 11 Сила — это "тихая сила" и мягкая настойчивость. ${"а".repeat(500)}`;
    const raw = [first, "б".repeat(400), "в".repeat(400)].join("\n\n");

    const result = validateChapter(core, raw);

    expect(result.ok && result.chapter.paragraphs).toEqual([first, "б".repeat(400), "в".repeat(400)]);
  });

  test("takes single line breaks as paragraph breaks when there are no blank lines", () => {
    const result = validateChapter(core, ["а".repeat(400), "б".repeat(400), "в".repeat(400)].join("\n"));

    expect(result.ok && result.chapter.paragraphs).toHaveLength(3);
  });

  test("joins lines of one paragraph that the model wrapped", () => {
    const wrapped = `${"а".repeat(200)}\n${"а".repeat(200)}`;
    const raw = [wrapped, "б".repeat(400), "в".repeat(400)].join("\n\n");

    const result = validateChapter(core, raw);

    expect(result.ok && result.chapter.paragraphs?.[0]).toBe(`${"а".repeat(200)} ${"а".repeat(200)}`);
  });

  test.each([
    ["an empty answer", "  \n ", "not_json"],
    ["broken JSON", '{"paragraphs": ["а" "б"]}', "not_json"],
    ["one block of text", "а".repeat(1600), "length"],
    ["a markdown heading", ["# Глава 1", "б".repeat(500), "в".repeat(500), "г".repeat(500)].join("\n\n"), "schema"],
    ["a bullet list", ["- " + "а".repeat(400), "- " + "б".repeat(400), "- " + "в".repeat(400)].join("\n"), "schema"],
    ["bold text", ["**Личность** " + "а".repeat(400), "б".repeat(400), "в".repeat(400)].join("\n\n"), "schema"],
  ])("rejects a plain-text chapter with %s", (_case, raw, reason) => {
    expect(validateChapter(core, raw)).toEqual({ ok: false, reason });
  });

  test.each([
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
    expect(prompt.system).toMatch(/между абзацами пустая строка/);
    expect(prompt.system).not.toMatch(/JSON-объект/);
    expect(JSON.parse(prompt.user)).toEqual(core);
    expect(buildPrompt(scenario).system).toMatch(/blindSpot/);
    expect(buildPrompt(scenario).system).toMatch(/JSON-объект/);
  });
});

describe("chapter length", () => {
  test("accepts a chapter of about a thousand characters, which the model often returns", () => {
    const result = validateChapter(core, ["а".repeat(330), "б".repeat(330), "в".repeat(330)].join("\n\n"));

    expect(result.ok).toBe(true);
  });

  test("asks the model for more than the check requires", () => {
    expect(buildPrompt(core).system).toMatch(/вместе 1400–2200 знаков/);
    expect(validateChapter(core, ["а".repeat(250), "б".repeat(250), "в".repeat(250)].join("\n\n"))).toEqual({ ok: false, reason: "length" });
  });
});
