import { SQUARE_LINES, type SquareLineId } from "@oracle/core";
import type { NumerologyKind } from "./numerology-manifest";

// Формат файла packages/content/numerology/<kind>-<key>.md: шапка (kind, key, title, description, batch) и разделы «## » в заданном порядке.
// Абзацы разделяются пустой строкой; строки «- » — пункты списка; в «Частых вопросах» вопрос — строка «**Вопрос?**», ответ — абзацы под ней.

export const NUMEROLOGY_SECTION_TITLES: Readonly<Record<Exclude<NumerologyKind, "square">, readonly string[]>> = {
  fate: ["Суть", "Сильные стороны", "Сложности", "Отношения", "Дело", "Вопрос для себя"],
  year: ["Тема года", "На что опереться", "Где осторожнее", "Вопрос для себя", "Три совета"],
  clock: ["Коротко", "Из каких чисел", "Вопрос для себя", "Частые вопросы"],
};

export const NUMEROLOGY_MIN_BODY: Readonly<Record<NumerologyKind, number>> = { fate: 4000, year: 4000, clock: 2500, square: 4500 };
const SQUARE_LINES_MIN_BODY = 5000;

// Названия линий квадрата Пифагора на сайте (спека 2026-11-08-pythagoras-square-design.md)
export const SQUARE_LINE_TITLES: Readonly<Record<SquareLineId, string>> = {
  celeustremlennost: "Целеустремлённость",
  semya: "Семья",
  privychki: "Привычки и стабильность",
  samoocenka: "Самооценка",
  byt: "Быт и работа",
  talant: "Талант",
  duhovnost: "Духовность",
  temperament: "Темперамент",
};

// Разделы страницы квадрата: у ячейки d — варианты «d» … «ddddd и больше», у страницы линий — по линии
export function squareSectionTitles(key: string): readonly string[] {
  if (key === "linii") return ["Что такое линии", ...SQUARE_LINES.map((line) => SQUARE_LINE_TITLES[line.id]), FAQ_TITLE];
  return ["Что значит ячейка", "Пустая ячейка", key, key.repeat(2), key.repeat(3), key.repeat(4), `${key.repeat(5)} и больше`, "Вопрос для себя", FAQ_TITLE];
}
const FAQ_TITLE = "Частые вопросы";
const ADVICE_TITLE = "Три совета";

export type NumerologySection = { readonly title: string; readonly paragraphs: readonly string[]; readonly items: readonly string[] };
export type NumerologyText = {
  readonly kind: NumerologyKind;
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly batch: number;
  readonly sections: readonly NumerologySection[];
  readonly faq: readonly { readonly question: string; readonly answer: string }[];
};

export class NumerologyFormatError extends Error {}

const KINDS: readonly NumerologyKind[] = ["fate", "year", "clock", "square"];
const KEY = /^(\d{1,2}|\d{2}-\d{2}|linii)$/;

const blocks = (text: string): string[] =>
  text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
const joinLines = (block: string): string => block.replace(/\s*\n\s*/g, " ").trim();

function section(title: string, body: string): NumerologySection {
  const paragraphs: string[] = [];
  const items: string[] = [];
  for (const block of blocks(body)) {
    const lines = block.split("\n").map((line) => line.trim());
    if (lines.every((line) => line.startsWith("- "))) items.push(...lines.map((line) => line.slice(2).trim()));
    else paragraphs.push(joinLines(block));
  }
  return { title, paragraphs, items };
}

function faqOf(body: string, fail: (message: string) => never): { question: string; answer: string }[] {
  const faq: { question: string; answer: string }[] = [];
  for (const block of blocks(body)) {
    const question = /^\*\*(.+\?)\*\*$/.exec(block)?.[1];
    if (question) faq.push({ question, answer: "" });
    else {
      const last = faq.at(-1);
      if (!last) fail(`«${FAQ_TITLE}» начинается с вопроса «**…?**»`);
      else last.answer = [last.answer, joinLines(block)].filter(Boolean).join(" ");
    }
  }
  if (faq.length < 2 || faq.some((item) => !item.answer)) fail(`«${FAQ_TITLE}» — не меньше двух вопросов, у каждого ответ`);
  return faq;
}

export function parseNumerologyPage(source: string, file: string): NumerologyText {
  const fail = (message: string): never => {
    throw new NumerologyFormatError(`${file}: ${message}`);
  };
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source.replace(/\r\n/g, "\n").trim());
  if (!match) return fail("нет шапки между строками ---");
  const fields = new Map((match[1] ?? "").split("\n").map((line) => [line.slice(0, line.indexOf(":")).trim(), line.slice(line.indexOf(":") + 1).trim()] as const));
  const kind = fields.get("kind") as NumerologyKind;
  if (!KINDS.includes(kind)) fail("kind — fate, year, clock или square");
  const key = fields.get("key") ?? "";
  if (!KEY.test(key)) fail("key — число или время «чч-мм»");
  const title = fields.get("title") ?? "";
  if (!title || title.length > 90) fail("title — от 1 до 90 знаков");
  const description = fields.get("description") ?? "";
  if (description.length < 90 || description.length > 175) fail("description — от 90 до 175 знаков");
  const batch = Number(fields.get("batch"));
  if (!Number.isInteger(batch) || batch < 1) fail("batch — целое число от 1");

  const body = match[2] ?? "";
  const [before, ...chunks] = body.split(/^## /m);
  if (before?.trim()) fail("текст до первого раздела");
  const titles = chunks.map((chunk) => chunk.slice(0, chunk.indexOf("\n") === -1 ? undefined : chunk.indexOf("\n")).trim());
  const expected = kind === "square" ? squareSectionTitles(key) : NUMEROLOGY_SECTION_TITLES[kind];
  if (titles.join("|") !== expected.join("|")) fail(`разделы по порядку: ${expected.join(", ")}`);
  const length = body.replace(/\s+/g, " ").trim().length;
  const minBody = kind === "square" && key === "linii" ? SQUARE_LINES_MIN_BODY : NUMEROLOGY_MIN_BODY[kind];
  if (length < minBody) fail(`текст — не меньше ${minBody} знаков, сейчас ${length}`);

  const sections: NumerologySection[] = [];
  let faq: { question: string; answer: string }[] = [];
  chunks.forEach((chunk, i) => {
    const title = titles[i] ?? "";
    const text = chunk.indexOf("\n") === -1 ? "" : chunk.slice(chunk.indexOf("\n") + 1);
    if (!text.trim()) fail(`раздел «${title}» пуст`);
    if (title === FAQ_TITLE) faq = faqOf(text, fail);
    else sections.push(section(title, text));
  });
  const advice = sections.find((s) => s.title === ADVICE_TITLE);
  if (advice && advice.items.length !== 3) fail(`«${ADVICE_TITLE}» — ровно три пункта «- »`);
  return { kind, key, title, description, batch, sections, faq };
}
