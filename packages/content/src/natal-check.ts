import { findStopPhrases } from "./check";
import type { NatalPageText } from "./natal";
import { natalPageBySlug, natalPageName, natalPageOrder } from "./natal-manifest";

// Проверка текстов натальных страниц: объём, обороты-предсказания и главное — шаблонность (одинаковые абзацы на разных страницах)

export const MIN_WORDS = { planet: 330, ascendant: 250, node: 330 } as const;
export const MAX_SHARED_SHINGLES = 0.25;
const SHINGLE_SIZE = 5;

const SECTION_COUNTS = { essence: { min: 3, max: 4 }, manifestation: { min: 3, max: 3 }, pitfalls: { min: 2, max: 2 } } as const;
const QUESTION_LENGTH = { min: 25, max: 220 } as const;

const wordList = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

export const pageText = (page: NatalPageText): string => [...page.essence, ...page.manifestation, ...page.pitfalls, ...page.questions, page.limits].join("\n");
export const pageWords = (page: NatalPageText): number => wordList(pageText(page)).length;

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
  const minimum = MIN_WORDS[ref.kind];
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
  // Шаблонность: любая пара страниц не должна делить больше четверти пятисловных последовательностей.
  // Множества считаются один раз на страницу: пар тысячи, а пересчёт на каждой паре занимал секунды
  const sets = pages.map((page) => shingles(pageText(page)));
  for (let i = 0; i < pages.length; i++) {
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
