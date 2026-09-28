import { describe, expect, test } from "vitest";
import { buildChapterInputs, buildScenarioInput } from "./input";
import { EXAMPLE_MATRIX } from "./testing";

const numbers = (input: { arcana: { number: number }[] }) => input.arcana.map((arcanum) => arcanum.number);

describe("chapter inputs", () => {
  test("take the arcana of each chapter from the matrix", () => {
    const inputs = buildChapterInputs(EXAMPLE_MATRIX);

    expect(inputs.map((input) => [input.chapter, numbers(input)])).toEqual([
      ["core", [18, 11]],
      ["task", [10]],
      ["love", [7, 4]],
      ["money", [5, 4]],
      ["family", [11, 18, 19, 10]],
      ["purpose", [11, 22, 6]],
    ]);
  });

  test("give each chapter its own blocks and the chapter description", () => {
    const [core, task, love] = buildChapterInputs(EXAMPLE_MATRIX);

    expect(Object.keys(core!.arcana[0]!.blocks)).toEqual(["Суть", "В личности"]);
    expect(Object.keys(core!.arcana[1]!.blocks)).toEqual(["Суть", "В центре"]);
    expect(Object.keys(task!.arcana[0]!.blocks)).toEqual(["Как задача", "В ресурсе", "В перекосе"]);
    expect(Object.keys(love!.arcana[0]!.blocks)).toEqual(["В отношениях"]);
    expect(love!.position).toMatch(/Линия любви/);
  });

  test("the scenario is built around the center and carries the openings of earlier chapters", () => {
    const input = buildScenarioInput(EXAMPLE_MATRIX, ["начало 1", "начало 2"]);

    expect(numbers(input)).toEqual([11]);
    expect(Object.keys(input.arcana[0]!.blocks)).toEqual(["В ресурсе", "В перекосе", "Действие на сегодня", "Вопрос для себя"]);
    expect(input.previous).toEqual(["начало 1", "начало 2"]);
  });

  test("contain no personal data: no birth date, e-mail, ids or name fields", () => {
    const all = JSON.stringify([...buildChapterInputs(EXAMPLE_MATRIX), buildScenarioInput(EXAMPLE_MATRIX, [])]);

    expect(all).not.toMatch(/1988|18\.11|@|[0-9a-f]{8}-[0-9a-f]{4}-/i);
    expect(all).not.toMatch(/"(userId|purchaseId|email|birthDate|displayName)"/);
  });
});
