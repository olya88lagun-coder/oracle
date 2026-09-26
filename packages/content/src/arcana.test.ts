import { describe, expect, test } from "vitest";
import { ArcanumFormatError, parseArcanum } from "./arcana";
import { sampleArcanumSource } from "./testing";

describe("parseArcanum", () => {
  test("reads the header and every section", () => {
    const arcanum = parseArcanum(sampleArcanumSource(), "11-sila.md");

    expect(arcanum).toEqual({
      number: 11,
      name: "Сила",
      slug: "sila",
      keywords: ["мягкая сила", "самообладание", "доверие к себе"],
      essence: ["Первый абзац о сути.", "Второй абзац о сути."],
      personality: ["Как это видно в характере."],
      center: ["На что можно опереться."],
      task: ["Какой урок стоит заметить."],
      resource: ["спокойствие", "ясность", "тепло"],
      distortion: ["спешка", "контроль", "обида"],
      action: "Сделайте одно маленькое дело.",
      question: "Что для вас сейчас важно?",
    });
  });

  test("accepts Windows line endings and joins wrapped lines of a paragraph", () => {
    const source = sampleArcanumSource({ essence: "Строка один\nстрока два." }).replace(/\n/g, "\r\n");
    expect(parseArcanum(source, "11-sila.md").essence).toEqual(["Строка один строка два."]);
  });

  test.each([
    ["missing header", "## Суть\n\nтекст", /шапк/],
    ["number out of range", sampleArcanumSource({ number: 23 }), /номер/],
    ["bad slug", sampleArcanumSource({ slug: "Сила" }), /slug/],
    ["too few keywords", sampleArcanumSource({ keywords: "одно; два" }), /keywords/],
    ["missing section", sampleArcanumSource({ drop: "В центре" }), /В центре/],
    ["text before the first section", sampleArcanumSource({ extra: "лишний текст\n" }), /до первой секции/],
  ])("rejects %s", (_case, source, message) => {
    expect(() => parseArcanum(source, "11-sila.md")).toThrow(ArcanumFormatError);
    expect(() => parseArcanum(source, "11-sila.md")).toThrow(message);
  });

  test("rejects an unknown or repeated section", () => {
    const unknown = `${sampleArcanumSource()}\n\n## Прогноз\n\nтекст`;
    const repeated = `${sampleArcanumSource()}\n\n## Суть\n\nещё`;
    expect(() => parseArcanum(unknown, "f.md")).toThrow(/Прогноз/);
    expect(() => parseArcanum(repeated, "f.md")).toThrow(/повтор/);
  });

  test("requires exactly three list items and a single paragraph where the format says so", () => {
    const twoItems = sampleArcanumSource().replace("- спокойствие\n- ясность\n- тепло", "- спокойствие\n- ясность");
    const notList = sampleArcanumSource().replace("- спешка", "спешка");
    const twoParagraphs = sampleArcanumSource().replace("Сделайте одно маленькое дело.", "Раз.\n\nДва.");
    expect(() => parseArcanum(twoItems, "f.md")).toThrow(/3 пункта/);
    expect(() => parseArcanum(notList, "f.md")).toThrow(/списк/);
    expect(() => parseArcanum(twoParagraphs, "f.md")).toThrow(/один абзац/);
  });

  test("names the file in every error", () => {
    expect(() => parseArcanum(sampleArcanumSource({ number: 0 }), "00-bad.md")).toThrow(/00-bad\.md/);
  });
});
