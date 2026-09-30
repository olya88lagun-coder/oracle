import type { TarotCardRef, TarotSuit } from "./tarot-deck";

export const TAROT_SECTION_TITLES = {
  essence: "Суть",
  love: "В отношениях",
  money: "В деле и деньгах",
  resource: "Ресурс",
  distortion: "Перекос",
  day: "Как карта дня",
  action: "Действие на сегодня",
  question: "Вопрос для себя",
} as const;
type SectionKey = keyof typeof TAROT_SECTION_TITLES;

export type TarotCard = TarotCardRef & {
  readonly keywords: readonly string[];
  readonly essence: readonly string[];
  readonly love: readonly string[];
  readonly money: readonly string[];
  readonly resource: readonly string[];
  readonly distortion: readonly string[];
  readonly day: readonly string[];
  readonly action: string;
  readonly question: string;
};

export class TarotFormatError extends Error {}

const SUITS: readonly TarotSuit[] = ["major", "wands", "cups", "swords", "pentacles"];
const LIST_LENGTH = 3;
const SLUG = /^[a-z]+(-[a-z]+)*$/;
const TITLE_TO_KEY = new Map<string, SectionKey>(Object.entries(TAROT_SECTION_TITLES).map(([key, title]) => [title, key as SectionKey]));

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

function listItems(text: string, title: string, fail: (message: string) => never): string[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.some((line) => !line.startsWith("- "))) fail(`«${title}» — только пункты списка «- »`);
  if (lines.length !== LIST_LENGTH) fail(`«${title}» — ровно ${LIST_LENGTH} пункта`);
  return lines.map((line) => line.slice(2).trim());
}

function single(text: string, title: string, fail: (message: string) => never): string {
  const [only, ...rest] = paragraphs(text);
  if (!only || rest.length > 0) fail(`«${title}» — ровно один абзац`);
  return only;
}

export function parseTarotCard(source: string, file: string): TarotCard {
  const fail = (message: string): never => {
    throw new TarotFormatError(`${file}: ${message}`);
  };
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source.replace(/\r\n/g, "\n").trim());
  if (!match) return fail("нет шапки между строками ---");
  const fields = new Map((match[1] ?? "").split("\n").map((line) => [line.slice(0, line.indexOf(":")).trim(), line.slice(line.indexOf(":") + 1).trim()] as const));
  const order = Number(fields.get("order"));
  if (!Number.isInteger(order) || order < 1 || order > 78) fail("order — от 1 до 78");
  const name = fields.get("name") ?? "";
  if (!name) fail("нет name");
  const slug = fields.get("slug") ?? "";
  if (!SLUG.test(slug)) fail("slug — латиница в нижнем регистре через дефис");
  const suit = fields.get("suit") as TarotSuit;
  if (!SUITS.includes(suit)) fail(`масть — одна из ${SUITS.join(", ")}`);
  const keywords = (fields.get("keywords") ?? "").split(";").map((word) => word.trim()).filter(Boolean);
  if (keywords.length < 3 || keywords.length > 4) fail("keywords — 3–4 фразы через «; »");

  const [before, ...chunks] = (match[2] ?? "").split(/^## /m);
  if (before?.trim()) fail("текст до первой секции");
  const found = new Map<SectionKey, string>();
  for (const chunk of chunks) {
    const newline = chunk.indexOf("\n");
    const title = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
    const key = TITLE_TO_KEY.get(title);
    if (!key) fail(`неизвестная секция «${title}»`);
    if (found.has(key!)) fail(`секция «${title}» повторяется`);
    found.set(key!, newline === -1 ? "" : chunk.slice(newline + 1).trim());
  }
  for (const [key, title] of Object.entries(TAROT_SECTION_TITLES)) if (!found.get(key as SectionKey)) fail(`нет секции «${title}»`);
  const text = (key: SectionKey) => found.get(key)!;
  return {
    order,
    slug,
    name,
    suit,
    rank: 0,
    keywords,
    essence: paragraphs(text("essence")),
    love: paragraphs(text("love")),
    money: paragraphs(text("money")),
    resource: listItems(text("resource"), TAROT_SECTION_TITLES.resource, fail),
    distortion: listItems(text("distortion"), TAROT_SECTION_TITLES.distortion, fail),
    day: paragraphs(text("day")),
    action: single(text("action"), TAROT_SECTION_TITLES.action, fail),
    question: single(text("question"), TAROT_SECTION_TITLES.question, fail),
  };
}
