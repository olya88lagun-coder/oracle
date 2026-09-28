import { CHAPTER_IDS } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { parsePositions, PositionsFormatError } from "./positions";
import { samplePositionsSource } from "./testing";

describe("parsePositions", () => {
  test("reads a description for every chapter", () => {
    const positions = parsePositions(samplePositionsSource());

    expect(Object.keys(positions).sort()).toEqual([...CHAPTER_IDS].sort());
    expect(positions.love).toBe("Что показывает глава love.");
  });

  test("joins wrapped lines and paragraphs into one text", () => {
    const positions = parsePositions(samplePositionsSource({ text: { core: "Строка один\nстрока два.\n\nВторой абзац." } }));
    expect(positions.core).toBe("Строка один строка два. Второй абзац.");
  });

  test.each([
    ["a missing chapter", samplePositionsSource({ drop: "family" }), /family/],
    ["an unknown chapter", `${samplePositionsSource()}\n\n## extra\n\nтекст`, /extra/],
    ["an empty chapter", samplePositionsSource({ text: { money: "" } }), /money/],
    ["a stop phrase", samplePositionsSource({ text: { task: "Вам суждено всё понять." } }), /вам суждено/],
  ])("rejects %s", (_case, source, message) => {
    expect(() => parsePositions(source)).toThrow(PositionsFormatError);
    expect(() => parsePositions(source)).toThrow(message);
  });
});
