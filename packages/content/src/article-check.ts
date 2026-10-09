import { ARCANA_COUNT, LILA_CELL_COUNT } from "@oracle/core";
import { ArticleMarkdownError, linksOf, parseMarkdown, plainText, type Block } from "./article-markdown";
import type { Article } from "./articles";
import { findStopPhrases } from "./check";

export type ArticleCheckContext = {
  readonly publicPaths: readonly string[];
  arcanumName(number: number): string | undefined;
  cellName(number: number): string | undefined;
  // сегодняшняя дата ГГГГ-ММ-ДД; статья не может быть датирована будущим
  readonly today: string;
};

export const TOOL_PATHS: readonly string[] = ["/matrica-sudby", "/sovmestimost", "/lila", "/taro", "/taro/karta-dnya"];
export const BODY_MIN = 4000;
export const BODY_MAX = 9000;
const SECTIONS_MIN = 3;
const DESCRIPTION_RANGE = [90, 175] as const;
const META_TITLE_MAX = 75;
const TITLE_MAX = 90;

const BRAND = /твой оракул|твоего оракула|твоему оракулу/giu;
const SECOND_PERSON = /(?<![\p{L}])(?:ты|тебе|тебя|тобой|твой|твоя|твоё|твое|твои|твоих|твоей|твоего|твоему|твоим)(?![\p{L}])/iu;
const AFTER_VY = /(?<![\p{L}])вы\s+(\p{L}+)/giu;
const SINGULAR_PAST = /^\p{L}{2,}(?:ал|ел|ил|ул|ыл|ял|ла|ло)$/u;
const PREDICTION = /предсказ[аы]/giu;
const NEGATED = /(?:^|[^\p{L}])(?:не|без|ни)\s+$/iu;
const KARMA = /карм/iu;
const OPENING = /^(?:в этой статье|в данной статье|сегодня мы|мы разберём)/iu;
const REFERENCE = /(аркан\p{L}*|клетк\p{L}*)\s+(\d+)(?:\s*«([^»]+)»)?/giu;

const normalize = (text: string) => text.toLowerCase().replace(/ё/g, "е");

function lengthErrors(article: Article, blocks: readonly Block[]): string[] {
  const errors: string[] = [];
  const body = plainText(blocks).length;
  if (body < BODY_MIN || body > BODY_MAX) errors.push(`объём текста ${body} знаков, нужно от ${BODY_MIN} до ${BODY_MAX}`);
  const sections = blocks.filter((block) => block.type === "h2").length;
  if (sections < SECTIONS_MIN) errors.push(`разделов «##» ${sections}, нужно не меньше ${SECTIONS_MIN}`);
  if (article.title.length > TITLE_MAX) errors.push(`title длиннее ${TITLE_MAX} знаков`);
  if (article.metaTitle.length > META_TITLE_MAX) errors.push(`metaTitle длиннее ${META_TITLE_MAX} знаков`);
  const [min, max] = DESCRIPTION_RANGE;
  if (article.description.length < min || article.description.length > max) errors.push(`description ${article.description.length} знаков, нужно от ${min} до ${max}`);
  const first = blocks[0];
  if (first?.type !== "p" || OPENING.test(plainText([first]))) errors.push("первый абзац должен сразу отвечать на запрос, без вступления «в этой статье…»");
  return errors;
}

function toneErrors(text: string): string[] {
  const errors: string[] = [];
  const stops = findStopPhrases(text);
  if (stops.length > 0) errors.push(`стоп-фразы: ${stops.join(", ")}`);
  if (KARMA.test(text)) errors.push("слова с основой «карм» запрещены");
  for (const match of text.matchAll(PREDICTION)) {
    if (!NEGATED.test(text.slice(Math.max(0, (match.index ?? 0) - 10), match.index))) errors.push("«предсказание» допустимо только с отрицанием: «не предсказание», «без предсказаний»");
  }
  if (SECOND_PERSON.test(text.replace(BRAND, ""))) errors.push("обращение только на «вы»: найдено «ты/твой»");
  for (const match of text.matchAll(AFTER_VY)) {
    if (SINGULAR_PAST.test(match[1] ?? "")) errors.push(`нейтральный род: после «вы» стоит форма единственного числа «${match[1]}» (нужно «сделали», а не «сделала»)`);
  }
  return errors;
}

function linkErrors(blocks: readonly Block[], publicPaths: readonly string[]): string[] {
  const links = linksOf(blocks);
  const errors = [...new Set(links)].filter((href) => !publicPaths.includes(href)).map((href) => `ссылка ведёт на несуществующую страницу ${href}`);
  if (!links.some((href) => TOOL_PATHS.includes(href))) errors.push(`нужна ссылка на практику сайта: ${TOOL_PATHS.join(", ")}`);
  if (new Set(links).size < 2) errors.push("нужно не меньше двух разных внутренних ссылок");
  return errors;
}

function referenceErrors(text: string, context: ArticleCheckContext): string[] {
  const errors: string[] = [];
  for (const match of text.matchAll(REFERENCE)) {
    const isArcanum = normalize(match[1] ?? "").startsWith("аркан");
    const number = Number(match[2]);
    const label = `${isArcanum ? "аркан" : "клетка"} ${number}`;
    const known = isArcanum ? number >= 1 && number <= ARCANA_COUNT : number >= 1 && number <= LILA_CELL_COUNT;
    const real = isArcanum ? context.arcanumName(number) : context.cellName(number);
    if (!known || real === undefined) errors.push(`${label} не существует`);
    else if (match[3] !== undefined && normalize(match[3]) !== normalize(real)) errors.push(`${label}: в тексте «${match[3]}», по нашим текстам «${real}»`);
  }
  return errors;
}

export function checkArticle(article: Article, context: ArticleCheckContext): string[] {
  let blocks: Block[];
  try {
    blocks = parseMarkdown(article.body);
  } catch (error) {
    if (error instanceof ArticleMarkdownError) return [`неподдерживаемый Markdown: ${error.message}`];
    throw error;
  }
  const text = [article.title, article.description, plainText(blocks), ...article.faq.flatMap((item) => [item.question, item.answer])].join("\n");
  return [
    ...lengthErrors(article, blocks),
    ...toneErrors(text),
    ...linkErrors(blocks, context.publicPaths),
    ...referenceErrors(text, context),
    ...(article.date > context.today ? [`дата ${article.date} в будущем`] : []),
  ];
}
