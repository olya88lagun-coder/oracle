import { findStopPhrases } from "./check";
import type { NatalHousePageText, NatalPageText } from "./natal";
import { natalHousePageBySlug, natalHousePageName, natalPageBySlug, natalPageName, natalPageOrder } from "./natal-manifest";

// Проверка текстов натальных страниц: объём, обороты-предсказания и главное — шаблонность (одинаковые абзацы на разных страницах)

export const MIN_WORDS = { planet: 330, ascendant: 250, node: 330, house: 330 } as const;
export const MAX_SHARED_SHINGLES = 0.25;
const SHINGLE_SIZE = 5;

const SECTION_COUNTS = { essence: { min: 3, max: 4 }, manifestation: { min: 3, max: 3 }, pitfalls: { min: 2, max: 2 } } as const;
const QUESTION_LENGTH = { min: 25, max: 220 } as const;

const wordList = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

type Reading = Pick<NatalPageText, "slug" | "name" | "keywords" | "essence" | "manifestation" | "pitfalls" | "questions" | "limits">;

export const pageText = (page: Reading): string => [...page.essence, ...page.manifestation, ...page.pitfalls, ...page.questions, page.limits].join("\n");
export const pageWords = (page: Reading): number => wordList(pageText(page)).length;

const shingles = (text: string, size = SHINGLE_SIZE): Set<string> => {
  const list = wordList(text);
  return new Set(list.slice(0, Math.max(0, list.length - size + 1)).map((_, i) => list.slice(i, i + size).join(" ")));
};

// Доля элементов первого множества, которые есть во втором
const shareOf = (first: ReadonlySet<string>, second: ReadonlySet<string>): number => {
  if (first.size === 0) return 0;
  let shared = 0;
  for (const item of first) if (second.has(item)) shared++;
  return shared / first.size;
};

// Доля пятисловных «шинглов» первой страницы, которые есть во второй
export function shingleOverlap(a: string, b: string, size = SHINGLE_SIZE): number {
  return shareOf(shingles(a, size), shingles(b, size));
}

function checkPage(page: NatalPageText): string[] {
  const errors: string[] = [];
  const at = (message: string) => errors.push(`${page.slug}: ${message}`);
  const ref = natalPageBySlug(page.slug);
  if (!ref) return [`${page.slug}: нет в манифесте`];
  if (page.body !== ref.body || page.sign !== ref.sign || page.batch !== ref.batch) at(`шапка не совпадает с манифестом (${ref.body}, ${ref.sign}, партия ${ref.batch})`);
  if (page.order !== natalPageOrder(page.slug)) at(`order должен быть ${natalPageOrder(page.slug)}`);
  const expectedName = natalPageName(ref.body, ref.sign);
  if (page.name !== expectedName) at(`name должно быть «${expectedName}»`);
  return [...errors, ...checkReading(page, MIN_WORDS[ref.kind])];
}

// Разделы, вопросы, объём и обороты-предсказания: одинаково для страниц «в знаке» и «в доме»
function checkReading(page: Reading, minimum: number): string[] {
  const errors: string[] = [];
  const at = (message: string) => errors.push(`${page.slug}: ${message}`);
  for (const key of ["essence", "manifestation", "pitfalls"] as const) {
    const range = SECTION_COUNTS[key];
    const count = page[key].length;
    if (count < range.min || count > range.max) at(`секция ${key}: абзацев от ${range.min} до ${range.max}, сейчас ${count}`);
  }
  for (const question of page.questions) {
    if (!question.endsWith("?")) at(`вопрос «${question.slice(0, 30)}…» должен заканчиваться знаком «?»`);
    if (question.length < QUESTION_LENGTH.min || question.length > QUESTION_LENGTH.max) at(`вопрос «${question.slice(0, 30)}…»: от ${QUESTION_LENGTH.min} до ${QUESTION_LENGTH.max} знаков`);
  }
  const words = pageWords(page);
  if (words < minimum) at(`слов ${words}, нужно не меньше ${minimum}`);
  const stops = findStopPhrases([page.name, ...page.keywords, pageText(page)].join("\n"));
  if (stops.length > 0) at(`запрещённые обороты — ${stops.join(", ")}`);
  return errors;
}

export function checkNatalPages(pages: readonly NatalPageText[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    if (seen.has(page.slug)) errors.push(`${page.slug}: страница повторяется`);
    seen.add(page.slug);
    errors.push(...checkPage(page));
  }
  return [...errors, ...similarPairs(pages, pages.length)];
}

// Шаблонность: любая пара страниц не должна делить больше четверти пятисловных последовательностей.
// Сравниваются пары, где хотя бы одна страница из первых `checked`; остальные страницы — только образец для сравнения.
// Множества считаются один раз на страницу: пар тысячи, а пересчёт на каждой паре занимал секунды
function similarPairs(pages: readonly Reading[], checked: number): string[] {
  const errors: string[] = [];
  const sets = pages.map((page) => shingles(pageText(page)));
  for (let i = 0; i < checked; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const first = pages[i];
      const second = pages[j];
      const firstSet = sets[i];
      const secondSet = sets[j];
      if (!first || !second || !firstSet || !secondSet) continue;
      const overlap = Math.max(shareOf(firstSet, secondSet), shareOf(secondSet, firstSet));
      if (overlap > MAX_SHARED_SHINGLES) errors.push(`${first.slug} и ${second.slug}: ${(overlap * 100).toFixed(0)}% общих фраз — страницы слишком похожи`);
    }
  }
  return errors;
}

// Страницы «планета в доме»: шапка по манифесту, те же разделы и объём, что у страниц знаков,
// и шаблонность — между собой и с каждой страницей «планета в знаке», чтобы дом не пересказывал знак
export function checkNatalHousePages(pages: readonly NatalHousePageText[], signPages: readonly NatalPageText[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    if (seen.has(page.slug)) errors.push(`${page.slug}: страница повторяется`);
    seen.add(page.slug);
    const ref = natalHousePageBySlug(page.slug);
    if (!ref) {
      errors.push(`${page.slug}: нет в манифесте`);
      continue;
    }
    if (page.body !== ref.body || page.house !== ref.house || page.batch !== ref.batch) errors.push(`${page.slug}: шапка не совпадает с манифестом (${ref.body}, ${ref.house} дом, партия ${ref.batch})`);
    const expectedName = natalHousePageName(ref.body, ref.house);
    if (page.name !== expectedName) errors.push(`${page.slug}: name должно быть «${expectedName}»`);
    errors.push(...checkReading(page, MIN_WORDS.house));
  }
  return [...errors, ...similarPairs([...pages, ...signPages], pages.length)];
}
