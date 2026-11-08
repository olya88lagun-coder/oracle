import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { collectArcana } from "../scripts/build-arcana.mjs";
import { findStopPhrases } from "./check";
import raw from "./generated/numerology.json";
import {
  acceptedNumerologyPages,
  NUMEROLOGY_ACCEPTED_BATCHES,
  NUMEROLOGY_MIN_BODY,
  NUMEROLOGY_PAGES,
  NumerologyFormatError,
  numerologyFile,
  numerologySummary,
  numerologyText,
  parseNumerologyPage,
} from "./numerology-texts";

const filler = (n: number) => Array.from({ length: n }, (_, i) => `Абзац ${i + 1} о символике числа и о том, как его можно читать спокойно и без спешки, примеряя к своей жизни.`).join("\n\n");

const FATE_SAMPLE = `---
kind: fate
key: 7
title: Число судьбы 7 — значение в нумерологии
description: Что означает число судьбы 7: образ исследователя, сильные стороны, сложности, отношения и дело. Символическое прочтение без прогнозов.
batch: 1
---

## Суть

Семёрку связывают с поиском смысла.

${filler(16)}

## Сильные стороны

${filler(6)}

## Сложности

${filler(6)}

## Отношения

${filler(6)}

## Дело

${filler(6)}

## Вопрос для себя

Что вы сейчас хотите понять глубже?
`;

const CLOCK_SAMPLE = `---
kind: clock
key: 11-11
title: 11:11 на часах — значение в нумерологии
description: Что значит 11:11 на часах в нумерологии: короткий ответ, из каких чисел складывается время и вопрос, с которым можно к нему отнестись.
batch: 3
---

## Коротко

11:11 читают как напоминание остановиться и заметить, о чём вы сейчас думаете.

${filler(12)}

## Из каких чисел

${filler(12)}

## Вопрос для себя

О чём была мысль за секунду до того, как вы посмотрели на часы?

## Частые вопросы

**Это знак свыше?**

Мы рассматриваем совпадение как повод для внимания, а не как послание.

**Нужно ли загадывать желание?**

Можно сформулировать намерение — это помогает яснее увидеть, чего вы хотите.
`;

describe("numerology manifest", () => {
  test("12 fate, 9 year and 37 clock pages in batches 12/9/15/15/7", () => {
    expect(NUMEROLOGY_PAGES).toHaveLength(58);
    const sizes = [1, 2, 3, 4, 5].map((batch) => NUMEROLOGY_PAGES.filter((page) => page.batch === batch).length);
    expect(sizes).toEqual([12, 9, 15, 15, 7]);
    expect(numerologyFile({ kind: "clock", key: "11-11" })).toBe("clock-11-11.md");
  });
});

describe("numerology page format", () => {
  test("parses a fate page into six sections without faq", () => {
    const text = parseNumerologyPage(FATE_SAMPLE, "fate-7.md");
    expect(text).toMatchObject({ kind: "fate", key: "7", batch: 1, faq: [] });
    expect(text.sections.map((s) => s.title)).toEqual(["Суть", "Сильные стороны", "Сложности", "Отношения", "Дело", "Вопрос для себя"]);
    expect(numerologySummary(text)).toBe("Семёрку связывают с поиском смысла.");
  });

  test("parses clock faq into questions and answers", () => {
    const text = parseNumerologyPage(CLOCK_SAMPLE, "clock-11-11.md");
    expect(text.faq).toEqual([
      { question: "Это знак свыше?", answer: "Мы рассматриваем совпадение как повод для внимания, а не как послание." },
      { question: "Нужно ли загадывать желание?", answer: "Можно сформулировать намерение — это помогает яснее увидеть, чего вы хотите." },
    ]);
    expect(text.sections.map((s) => s.title)).toEqual(["Коротко", "Из каких чисел", "Вопрос для себя"]);
  });

  test.each([
    ["missing section", FATE_SAMPLE.replace("## Дело", "## Работа")],
    ["sections out of order", FATE_SAMPLE.replace("## Сильные стороны", "## TEMP").replace("## Сложности", "## Сильные стороны").replace("## TEMP", "## Сложности")],
    ["short description", FATE_SAMPLE.replace(/description: .*/, "description: Коротко.")],
    ["short body", FATE_SAMPLE.replace(/Абзац \d+[^\n]*\n\n/g, "")],
  ])("rejects %s", (_, source) => {
    expect(() => parseNumerologyPage(source, "fate-7.md")).toThrow(NumerologyFormatError);
  });

  test("year advice needs exactly three items", () => {
    const year = (advice: string) => `---
kind: year
key: 1
title: Личный год 1 в 2027 году
description: Что означает личный год 1 в 2027 году по нумерологии: тема года, на что опереться, где осторожнее и три практических совета.
batch: 2
---

## Тема года

${filler(26)}

## На что опереться

${filler(6)}

## Где осторожнее

${filler(6)}

## Вопрос для себя

С чего вы хотите начать?

## Три совета

${advice}
`;
    expect(parseNumerologyPage(year("- Первый\n- Второй\n- Третий"), "year-1.md").sections.at(-1)?.items).toEqual(["Первый", "Второй", "Третий"]);
    expect(() => parseNumerologyPage(year("- Первый\n- Второй"), "year-1.md")).toThrow(NumerologyFormatError);
  });
});

describe("numerology texts on disk", () => {
  test("the committed numerology.json matches the markdown files — run pnpm content:build after editing texts", () => {
    expect(raw).toEqual(collectArcana(fileURLToPath(new URL("../numerology", import.meta.url))));
  });

  const files = Object.entries(raw as Record<string, string>);
  test.each(files.length ? files : [["(none yet)", ""]])("%s is valid, calm and long enough", (name, source) => {
    if (!source) return;
    const text = parseNumerologyPage(source, `${name}.md`);
    expect(`${text.kind}-${text.key}`).toBe(name);
    expect(NUMEROLOGY_PAGES.find((page) => page.kind === text.kind && page.key === text.key)?.batch).toBe(text.batch);
    expect(findStopPhrases(source)).toEqual([]);
    expect(source.toLowerCase()).not.toContain("карм");
    expect(NUMEROLOGY_MIN_BODY[text.kind]).toBeGreaterThan(0);
  });

  test("only accepted batches are published", () => {
    for (const page of NUMEROLOGY_PAGES) {
      if (!NUMEROLOGY_ACCEPTED_BATCHES.has(page.batch)) expect(numerologyText(page.kind, page.key)).toBeUndefined();
    }
    for (const page of acceptedNumerologyPages("fate")) expect(numerologyText("fate", page.key)).toBeDefined();
  });
});
