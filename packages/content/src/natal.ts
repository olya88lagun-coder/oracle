import type { BodyId, SignId } from "@oracle/core/natal";
import type { NatalBody } from "./natal-manifest";

// Формат файла текста натальной страницы (packages/content/natal/NNN-slug.md): шапка и пять разделов, как у карт Таро

export const NATAL_SECTION_TITLES = {
  essence: "Суть",
  manifestation: "Как это может проявляться",
  pitfalls: "Подводные камни",
  questions: "Вопросы для размышления",
  limits: "Границы трактовки",
} as const;
type SectionKey = keyof typeof NATAL_SECTION_TITLES;

export type NatalPageText = {
  readonly order: number;
  readonly slug: string;
  readonly name: string;
  readonly body: NatalBody;
  readonly sign: SignId;
  readonly batch: number;
  readonly keywords: readonly string[];
  readonly essence: readonly string[];
  readonly manifestation: readonly string[];
  readonly pitfalls: readonly string[];
  readonly questions: readonly string[];
  readonly limits: string;
};

export class NatalFormatError extends Error {}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 5;
const TITLE_TO_KEY = new Map<string, SectionKey>(Object.entries(NATAL_SECTION_TITLES).map(([key, title]) => [title, key as SectionKey]));

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

function listItems(text: string, fail: (message: string) => never): string[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.some((line) => !line.startsWith("- "))) fail(`«${NATAL_SECTION_TITLES.questions}» — только пункты списка «- »`);
  if (lines.length < MIN_QUESTIONS || lines.length > MAX_QUESTIONS) fail(`«${NATAL_SECTION_TITLES.questions}» — от ${MIN_QUESTIONS} до ${MAX_QUESTIONS} вопросов`);
  return lines.map((line) => line.slice(2).trim());
}

type Fail = (message: string) => never;
type Reading = Omit<NatalPageText, "order" | "sign" | "body" | "batch">;

export function parseNatalPage(source: string, file: string): NatalPageText {
  const fail = (message: string): never => {
    throw new NatalFormatError(`${file}: ${message}`);
  };
  const { fields, reading } = parseReading(source, fail);
  const order = Number(fields.get("order"));
  if (!Number.isInteger(order) || order < 1 || order > 144) fail("order — от 1 до 144");
  const batch = Number(fields.get("batch"));
  if (!Number.isInteger(batch) || batch < 1 || batch > 5) fail("batch — от 1 до 5");
  const body = (fields.get("body") ?? "") as NatalBody;
  const sign = (fields.get("sign") ?? "") as SignId;
  if (!body || !sign) fail("нужны body и sign");
  return { ...reading, order, body, sign, batch };
}

// Страница «планета в доме» (packages/content/natal-house-pages/<слаг>.md): та же шапка и разделы, но вместо order и sign — house
export type NatalHousePageText = Reading & { readonly body: BodyId; readonly house: number; readonly batch: number };

export function parseNatalHousePage(source: string, file: string): NatalHousePageText {
  const fail = (message: string): never => {
    throw new NatalFormatError(`${file}: ${message}`);
  };
  const { fields, reading } = parseReading(source, fail);
  const house = Number(fields.get("house"));
  if (!Number.isInteger(house) || house < 1 || house > 12) fail("house — от 1 до 12");
  const batch = Number(fields.get("batch"));
  if (!Number.isInteger(batch) || batch < 1) fail("batch — целое число");
  const body = (fields.get("body") ?? "") as BodyId;
  if (!body) fail("нужно body");
  return { ...reading, body, house, batch };
}

// Общая часть страниц «в знаке» и «в доме»: name, slug, keywords и пять разделов
function parseReading(source: string, fail: Fail): { fields: Map<string, string>; reading: Reading } {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source.replace(/\r\n/g, "\n").trim());
  if (!match) return fail("нет шапки между строками ---");
  const fields = new Map((match[1] ?? "").split("\n").map((line) => [line.slice(0, line.indexOf(":")).trim(), line.slice(line.indexOf(":") + 1).trim()] as const));
  const name = fields.get("name") ?? "";
  if (!name) fail("нет name");
  const slug = fields.get("slug") ?? "";
  if (!SLUG.test(slug)) fail("slug — латиница в нижнем регистре и цифры через дефис");
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
    if (found.has(key as SectionKey)) fail(`секция «${title}» повторяется`);
    found.set(key as SectionKey, newline === -1 ? "" : chunk.slice(newline + 1).trim());
  }
  for (const [key, title] of Object.entries(NATAL_SECTION_TITLES)) if (!found.get(key as SectionKey)) fail(`нет секции «${title}»`);
  const text = (key: SectionKey) => found.get(key) ?? "";
  const [limits, ...extra] = paragraphs(text("limits"));
  if (!limits || extra.length > 0) fail(`«${NATAL_SECTION_TITLES.limits}» — ровно один абзац`);
  return {
    fields,
    reading: {
      slug,
      name,
      keywords,
      essence: paragraphs(text("essence")),
      manifestation: paragraphs(text("manifestation")),
      pitfalls: paragraphs(text("pitfalls")),
      questions: listItems(text("questions"), fail),
      limits: limits ?? "",
    },
  };
}
