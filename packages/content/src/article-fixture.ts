import { parseArticle, type Article } from "./articles";

const BASE_HEADER: Readonly<Record<string, string>> = {
  title: "Предназначение в матрице судьбы",
  metaTitle: "Предназначение в матрице судьбы — личное, социальное, духовное",
  description: "Что такое личное, социальное и духовное предназначение в матрице судьбы и как читать их как направления, а не как задания.",
  date: "2026-10-02",
  image: "/hero.webp",
  imageAlt: "Матрица судьбы — символическая схема по дате рождения",
  cluster: "matrix",
  basis: "positions; matrix-formulas",
  faq: "Что такое предназначение? => Направление, в котором жизнь может ощущаться осмысленной. || Это задание извне? => Нет, это гипотеза для размышления. || Где оно в матрице? => Оно собирается из основных точек.",
};

const SENTENCE = "Позиция матрицы описывает одну из сторон характера, и её значение можно читать как гипотезу для размышления, а не как приговор. ";

export const section = (title: string, repeat = 14): string => `## ${title}\n\n${SENTENCE.repeat(repeat).trim()}`;

export const DEFAULT_BODY = [
  "Предназначение в матрице судьбы — это три направления, в которых жизнь может ощущаться осмысленной. Вы можете [рассчитать свою матрицу](/matrica-sudby) и посмотреть на них самостоятельно.",
  section("Личное предназначение"),
  `${section("Социальное предназначение")}\n\nЧасто это связывают с [арканом Маг](/matrica-sudby/arkan-1-mag).`,
  section("Духовное предназначение"),
].join("\n\n");

// null убирает поле из шапки
export function articleSource(overrides: Readonly<Record<string, string | null>> = {}, body: string = DEFAULT_BODY): string {
  const header = { ...BASE_HEADER, ...overrides };
  const lines = Object.entries(header)
    .filter((entry): entry is [string, string] => entry[1] !== null)
    .map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join("\n")}\n---\n${body}`;
}

export const sampleArticle = (overrides: Readonly<Record<string, string | null>> = {}, body: string = DEFAULT_BODY): Article =>
  parseArticle("prednaznachenie-v-matritse-sudby", articleSource(overrides, body));
