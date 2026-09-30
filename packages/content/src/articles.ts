import { isBasisKey, type ArticleBasisKey } from "./article-basis";

export type ArticleFaq = { readonly question: string; readonly answer: string };

export type Article = {
  readonly slug: string;
  readonly title: string;
  readonly metaTitle: string;
  readonly description: string;
  readonly date: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly cluster: string;
  readonly basis: readonly ArticleBasisKey[];
  readonly faq: readonly ArticleFaq[];
  readonly body: string;
};

export class ArticleFormatError extends Error {}

export const FAQ_MIN = 3;
export const FAQ_MAX = 5;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FIELDS = ["title", "metaTitle", "description", "date", "image", "imageAlt", "cluster", "basis", "faq"] as const;

function readFields(header: string, fail: (message: string) => never): Map<string, string> {
  const fields = new Map<string, string>();
  for (const line of header.split("\n").filter((row) => row.trim())) {
    const colon = line.indexOf(":");
    if (colon < 1) fail(`строка шапки без «ключ: значение»: ${line}`);
    const key = line.slice(0, colon).trim();
    if (!(FIELDS as readonly string[]).includes(key)) fail(`неизвестное поле шапки ${key}`);
    if (fields.has(key)) fail(`поле ${key} повторено`);
    fields.set(key, line.slice(colon + 1).trim());
  }
  for (const key of FIELDS) if (!fields.get(key)) fail(`нет поля ${key}`);
  return fields;
}

function readFaq(value: string, fail: (message: string) => never): ArticleFaq[] {
  const items = value.split("||").map((pair) => {
    const [question = "", ...rest] = pair.split("=>");
    return { question: question.trim(), answer: rest.join("=>").trim() };
  });
  if (items.length < FAQ_MIN || items.length > FAQ_MAX) fail(`faq — от ${FAQ_MIN} до ${FAQ_MAX} пар «Вопрос? => Ответ.» через ||`);
  for (const item of items) {
    if (!item.question.endsWith("?")) fail(`вопрос faq должен заканчиваться «?»: ${item.question}`);
    if (!item.answer) fail(`нет ответа на вопрос ${item.question}`);
  }
  return items;
}

export function parseArticle(name: string, raw: string): Article {
  const fail = (message: string): never => {
    throw new ArticleFormatError(`${name}.md: ${message}`);
  };
  if (!SLUG.test(name)) fail("slug — латиница в нижнем регистре и цифры через дефис");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw.replace(/\r\n/g, "\n").trim());
  if (!match) return fail("нет шапки между строками ---");
  const fields = readFields(match[1] ?? "", fail);
  const value = (key: (typeof FIELDS)[number]): string => fields.get(key) ?? "";

  const date = value("date");
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!DATE.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) fail("date — существующая дата в формате ГГГГ-ММ-ДД");
  const image = value("image");
  if (!image.startsWith("/") || !image.endsWith(".webp")) fail("image — путь от корня сайта к файлу .webp");
  const keys = value("basis").split(";").map((key) => key.trim()).filter(Boolean);
  if (keys.length === 0) fail("basis — хотя бы один ключ основания через «; »");
  for (const key of keys) if (!isBasisKey(key)) fail(`basis: неизвестный ключ ${key}`);

  return {
    slug: name,
    title: value("title"),
    metaTitle: value("metaTitle"),
    description: value("description"),
    date,
    image,
    imageAlt: value("imageAlt"),
    cluster: value("cluster"),
    basis: keys.filter(isBasisKey),
    faq: readFaq(value("faq"), fail),
    body: (match[2] ?? "").trim(),
  };
}
