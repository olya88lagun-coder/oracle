import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { calculateLifeThread, THREAD_CHAPTER_IDS } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { NUMEROLOGY_SECTION_TITLES, parseNumerologyPage, type NumerologyText } from "./numerology";
import type { NumerologyKind } from "./numerology-manifest";
import { numerologyText } from "./numerology-texts";
import { buildThreadReport, type ThreadTextReader } from "./thread-report";

const TODAY = new Date(Date.UTC(2026, 10, 18));
const thread = (iso: string) => {
  const result = calculateLifeThread(iso, TODAY);
  if (!result) throw new Error(`bad date ${iso}`);
  return result;
};

// Каждый абзац и пункт несёт «вид-ключ · раздел», чтобы по тексту было видно, откуда он взят
const fixture: ThreadTextReader = (kind, key) => {
  const titles = NUMEROLOGY_SECTION_TITLES[kind as Exclude<NumerologyKind, "square" | "pair">];
  return {
    kind,
    key,
    title: `${kind}-${key}`,
    description: "",
    batch: 1,
    sections: titles.map((title) => ({
      title,
      paragraphs: [`${kind}-${key} · ${title} · 1`, `${kind}-${key} · ${title} · 2`],
      items: title === "Три правила" || title === "Вопросы себе" ? [1, 2, 3].map((n) => `${kind}-${key} · ${title} · пункт ${n}`) : [],
    })),
    faq: [],
  };
};

const chapterOf = (iso: string, id: (typeof THREAD_CHAPTER_IDS)[number], read = fixture) => {
  const chapter = buildThreadReport(thread(iso), read).find((c) => c.id === id);
  if (!chapter) throw new Error(`no chapter ${id}`);
  return chapter;
};
const textOf = (blocks: { paragraphs: string[] }[]) => blocks.flatMap((b) => b.paragraphs).join("\n");

describe("сборщик глав разбора нити (15.07.1990, сегодня 18.11.2026)", () => {
  test("шесть глав по порядку, источник — готовые тексты", () => {
    const chapters = buildThreadReport(thread("1990-07-15"), fixture);
    expect(chapters.map((c) => c.id)).toEqual([...THREAD_CHAPTER_IDS]);
    expect(chapters.every((c) => c.source === "fallback")).toBe(true);
  });

  test("now: вступление, текущий год целиком и двенадцать месяцев", () => {
    const { blocks } = chapterOf("1990-07-15", "now");
    expect(blocks).toHaveLength(14);
    expect(blocks[0]?.heading).toBeUndefined();
    expect(blocks[1]?.heading).toBe("2026 · год 5 · перемены");
    const year = textOf([blocks[1] ?? { paragraphs: [] }]);
    expect(year).toContain("thread-5 · Тема года · 2");
    expect(year).toContain("thread-5 · На что опереться · 2");
    expect(year).not.toContain("Где осторожнее");
    const months = blocks.slice(2);
    expect(months[0]?.heading).toBe("15 июля — 14 августа");
    expect(months[11]?.heading).toBe("15 июня — 14 июля");
    expect(months[0]?.paragraphs.join()).toContain("month-3 · Тема месяца");
    expect(months.every((m) => !m.paragraphs.join().includes("Как его провести"))).toBe(true);
  });

  test("years: семь будущих лет, по первому абзацу двух разделов", () => {
    const { blocks } = chapterOf("1990-07-15", "years");
    expect(blocks.map((b) => b.heading?.slice(0, 4))).toEqual(["2027", "2028", "2029", "2030", "2031", "2032", "2033"]);
    expect(blocks[0]?.heading).toBe("2027 · год 6 · забота");
    expect(blocks[0]?.paragraphs).toEqual(["thread-6 · Тема года · 1", "thread-6 · Где осторожнее · 1"]);
  });

  test("past: четыре прошлых года с вопросами из past", () => {
    const { blocks } = chapterOf("1990-07-15", "past");
    const years = blocks.filter((b) => b.heading);
    expect(years.map((b) => b.heading?.slice(0, 4))).toEqual(["2022", "2023", "2024", "2025"]);
    expect(years[0]?.paragraphs).toContain("past-1 · Вопросы себе · пункт 1");
    expect(years[0]?.paragraphs.join()).not.toContain("Если вспомнить");
    expect(blocks[0]?.heading).toBeUndefined();
  });

  test("periods: четыре блока, граница только у текущего и следующего", () => {
    const { blocks } = chapterOf("1990-07-15", "periods");
    expect(blocks.map((b) => b.heading)).toEqual(["I период · формирование · 1990–2021", "II период · зрелость · 2021–2030", "III период · плоды · 2030–2039", "IV период · мудрость · с 2039"]);
    const has = (i: number) => blocks[i]?.paragraphs.join("\n").includes("Как пройти границу");
    expect([has(0), has(1), has(2), has(3)]).toEqual([false, true, true, false]);
    expect(blocks[0]?.paragraphs).toHaveLength(2);
    expect(blocks[0]?.paragraphs[0]).toMatch(/^period-\d · Сила периода · 1$/);
    expect(blocks[0]?.paragraphs[1]).toMatch(/^period-\d · Трудность периода · 1$/);
  });

  test("rhythm: прошлая и ближайшая вершина, срок, длина цикла", () => {
    const text = textOf(chapterOf("1990-07-15", "rhythm").blocks);
    expect(text).toContain("2020");
    expect(text).toContain("2029");
    expect(text).toContain("три года");
    expect(text).toContain("девять лет");
  });

  test("rules: три пункта правил года 5 и вопрос", () => {
    const { blocks } = chapterOf("1990-07-15", "rules");
    expect(blocks[0]?.paragraphs).toEqual([1, 2, 3].map((n) => `rules-5 · Три правила · пункт ${n}`));
    expect(blocks[1]?.paragraphs).toContain("rules-5 · Вопрос на год · 1");
  });

  test("родился в 2026: в «past» нет годов, есть вступление про малое прошлое", () => {
    const { blocks } = chapterOf("2026-05-01", "past");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.heading).toBeUndefined();
    expect(blocks[0]?.paragraphs.join()).toContain("пока прошлого мало");
  });

  test("родился в 1900: не падает, главы не пустые", () => {
    const chapters = buildThreadReport(thread("1900-01-01"), fixture);
    expect(chapters.every((c) => c.blocks.length > 0)).toBe(true);
  });

  test("нет текста — ошибка с видом и ключом", () => {
    const without: ThreadTextReader = (kind, key) => (kind === "rules" ? undefined : fixture(kind, key));
    expect(() => buildThreadReport(thread("1990-07-15"), without)).toThrow("thread report: missing rules-5");
  });
});

describe("настоящие тексты", () => {
  const dir = fileURLToPath(new URL("../numerology/", import.meta.url));
  // Партия 10 ещё не принята, поэтому month, past и rules читаем из файлов напрямую
  const real: ThreadTextReader = (kind, key): NumerologyText | undefined => {
    if (kind === "thread" || kind === "period") return numerologyText(kind, key);
    const file = `${kind}-${key}.md`;
    return parseNumerologyPage(readFileSync(dir + file, "utf8"), file);
  };

  test("все шесть глав собираются из настоящих разделов", () => {
    const chapters = buildThreadReport(thread("1990-07-15"), real);
    expect(chapters).toHaveLength(6);
    for (const chapter of chapters) {
      expect(chapter.blocks.length).toBeGreaterThan(0);
      for (const block of chapter.blocks) {
        expect(block.paragraphs.length).toBeGreaterThan(0);
        expect(block.paragraphs.every((p) => p.trim().length > 0)).toBe(true);
      }
    }
  });
});
