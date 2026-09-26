import { ARCANA_COUNT } from "@oracle/core";

export const SECTION_TITLES = {
  essence: "Суть",
  personality: "В личности",
  center: "В центре",
  task: "Как задача",
  resource: "В ресурсе",
  distortion: "В перекосе",
  action: "Действие на сегодня",
  question: "Вопрос для себя",
} as const;

type SectionKey = keyof typeof SECTION_TITLES;

export type Arcanum = {
  readonly number: number;
  readonly name: string;
  readonly slug: string;
  readonly keywords: readonly string[];
  readonly essence: readonly string[];
  readonly personality: readonly string[];
  readonly center: readonly string[];
  readonly task: readonly string[];
  readonly resource: readonly string[];
  readonly distortion: readonly string[];
  readonly action: string;
  readonly question: string;
};

export class ArcanumFormatError extends Error {}

const LIST_SECTIONS: readonly SectionKey[] = ["resource", "distortion"];
const SINGLE_SECTIONS: readonly SectionKey[] = ["action", "question"];
const LIST_LENGTH = 3;
const SLUG = /^[a-z]+(-[a-z]+)*$/;
const TITLE_TO_KEY = new Map<string, SectionKey>(Object.entries(SECTION_TITLES).map(([key, title]) => [title, key as SectionKey]));

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

function readHeader(header: string, fail: (message: string) => never) {
  const fields = new Map(
    header.split("\n").map((line) => {
      const colon = line.indexOf(":");
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()] as const;
    }),
  );
  const number = Number(fields.get("number"));
  if (!Number.isInteger(number) || number < 1 || number > ARCANA_COUNT) fail(`номер аркана должен быть от 1 до ${ARCANA_COUNT}`);
  const name = fields.get("name") ?? "";
  if (!name) fail("нет name");
  const slug = fields.get("slug") ?? "";
  if (!SLUG.test(slug)) fail("slug — латиница в нижнем регистре через дефис");
  const keywords = (fields.get("keywords") ?? "").split(";").map((word) => word.trim()).filter(Boolean);
  if (keywords.length < 3 || keywords.length > 4) fail("keywords — 3–4 фразы через «; »");
  return { number, name, slug, keywords };
}

function readSections(body: string, fail: (message: string) => never): Record<SectionKey, string> {
  const [before, ...chunks] = body.split(/^## /m);
  if (before?.trim()) fail("текст до первой секции");
  const found = new Map<SectionKey, string>();
  for (const chunk of chunks) {
    const newline = chunk.indexOf("\n");
    const title = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
    const key = TITLE_TO_KEY.get(title);
    if (!key) fail(`неизвестная секция «${title}»`);
    if (found.has(key)) fail(`секция «${title}» повторяется`);
    found.set(key, newline === -1 ? "" : chunk.slice(newline + 1).trim());
  }
  for (const [key, title] of Object.entries(SECTION_TITLES)) {
    if (!found.get(key as SectionKey)) fail(`нет секции «${title}»`);
  }
  return Object.fromEntries(found) as Record<SectionKey, string>;
}

function listItems(text: string, title: string, fail: (message: string) => never): string[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.some((line) => !line.startsWith("- "))) fail(`«${title}» — только пункты списка «- »`);
  if (lines.length !== LIST_LENGTH) fail(`«${title}» — ровно ${LIST_LENGTH} пункта`);
  return lines.map((line) => line.slice(2).trim());
}

function singleParagraph(text: string, title: string, fail: (message: string) => never): string {
  const [only, ...rest] = paragraphs(text);
  if (!only || rest.length > 0) fail(`«${title}» — ровно один абзац`);
  return only;
}

export function parseArcanum(source: string, file: string): Arcanum {
  const fail = (message: string): never => {
    throw new ArcanumFormatError(`${file}: ${message}`);
  };
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source.replace(/\r\n/g, "\n").trim());
  if (!match) return fail("нет шапки между строками ---");
  const header = readHeader(match[1] ?? "", fail);
  const sections = readSections(match[2] ?? "", fail);

  const prose = (key: SectionKey) => paragraphs(sections[key]);
  const [resource, distortion] = LIST_SECTIONS.map((key) => listItems(sections[key], SECTION_TITLES[key], fail)) as [string[], string[]];
  const [action, question] = SINGLE_SECTIONS.map((key) => singleParagraph(sections[key], SECTION_TITLES[key], fail)) as [string, string];

  return {
    ...header,
    essence: prose("essence"),
    personality: prose("personality"),
    center: prose("center"),
    task: prose("task"),
    resource,
    distortion,
    action,
    question,
  };
}
