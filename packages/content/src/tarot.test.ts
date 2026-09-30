import { describe, expect, test } from "vitest";
import { parseTarotCard, TarotFormatError } from "./tarot";

const P = "Абзац текста. ".repeat(3).trim();
const source = () => `---
order: 2
name: Маг
slug: mag
suit: major
keywords: инициатива; воля; умение воплощать
---

## Суть

${P}

${P}

## В отношениях

${P}

## В деле и деньгах

${P}

## Ресурс

- один
- два
- три

## Перекос

- раз
- два
- три

## Как карта дня

${P}

## Действие на сегодня

${P}

## Вопрос для себя

Что вы начнёте сегодня?
`;

describe("parseTarotCard", () => {
  test("reads the header and every section", () => {
    const card = parseTarotCard(source(), "02-mag.md");
    expect(card).toMatchObject({ order: 2, name: "Маг", slug: "mag", suit: "major", keywords: ["инициатива", "воля", "умение воплощать"] });
    expect(card.essence).toHaveLength(2);
    expect(card.resource).toEqual(["один", "два", "три"]);
    expect(card.question).toBe("Что вы начнёте сегодня?");
  });

  test("rejects a missing section, an unknown one, a bad list, a bad suit and text before the first section", () => {
    expect(() => parseTarotCard(source().replace("## Как карта дня", "## Лишнее"), "f.md")).toThrow(TarotFormatError);
    expect(() => parseTarotCard(source().replace("- три\n\n## Перекос", "\n## Перекос"), "f.md")).toThrow(/ровно 3/);
    expect(() => parseTarotCard(source().replace("suit: major", "suit: coins"), "f.md")).toThrow(/масть/);
    expect(() => parseTarotCard(source().replace("## Суть", "вступление\n\n## Суть"), "f.md")).toThrow(TarotFormatError);
    expect(() => parseTarotCard("без шапки", "f.md")).toThrow(/шапк/);
  });
});
