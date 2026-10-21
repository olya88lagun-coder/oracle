import { findStopPhrases } from "@oracle/content";
import type { NatalChapterInput } from "./natal-input";
import { NATAL_PROSE_LIMITS } from "./natal-prompt";
import type { NatalChapter } from "./natal-fallback";
import { extractJson, readProse, readScenario, type ValidationFailure } from "./validate";

// Модель иногда пишет, что данных о доме нет («информация о положении планет в этом доме отсутствует»): читателю это не нужно
const MISSING_DATA = /отсутству|нет\s+(данных|информации|сведений)|недостаточно\s+(данных|информации)|(данных|информации|сведений)[^.]{0,40}недостаточно|не\s+(указан|известн)/i;
// Обороты, выдающие род читателя: «делает вас мягким», «быть более эффективным», «вы чувствовал/чувствовала».
// \b для кириллицы в JS не работает, границы слова задаём через (?<![а-яё]) и (?![а-яё])
const GENDERED = [
  /(?<![а-яё])(делает|сделает|делают|сделают|делая|сделав|считает|считают)\s+(вас|вам)\s+(более\s+|менее\s+|очень\s+)?[а-яё]+(ым|им|ой)(?![а-яё])/i,
  // после прилагательного — знак препинания или предлог/союз: «быть осторожным, чтобы», «быть более эффективным в». «стать мощным инструментом», «стать основой» — не про читателя
  /(?<![а-яё])(быть|стать|оставаться|остаться|казаться|показаться|выглядеть)\s+(более\s+|менее\s+|очень\s+)?[а-яё]+(ым|им|ой)(?=\s*[,.;:!?)]|\s+(в|во|при|к|ко|с|со|и|или|но|а|чтобы|перед|по|для|на|от)(?![а-яё]))/i,
  /(?<![а-яё])вы\s+(не\s+)?[а-яё]{2,}(ла|л)(?![а-яё])/i,
];

export type NatalValidation = { ok: true; chapter: NatalChapter } | { ok: false; reason: ValidationFailure };

// Проверка ответа модели: форма (текст нужной длины или JSON сценария), объём и обороты-предсказания из общего стоп-списка
export function validateNatalChapter(input: NatalChapterInput, raw: string): NatalValidation {
  let chapter: NatalChapter;
  if (input.chapter === "scenario") {
    const value = extractJson(raw);
    if (typeof value !== "object" || value === null) return { ok: false, reason: "not_json" };
    const read = readScenario(value as Record<string, unknown>);
    if (!read.ok) return read;
    chapter = { id: input.chapter, source: "ai", scenario: read.scenario };
  } else {
    const read = readProse(raw, NATAL_PROSE_LIMITS);
    if (!read.ok) return read;
    chapter = { id: input.chapter, source: "ai", paragraphs: read.paragraphs };
  }
  const text = [...(chapter.paragraphs ?? []), ...Object.values(chapter.scenario ?? {})].join("\n");
  if (findStopPhrases(text).length > 0) return { ok: false, reason: "stop_words" };
  if (MISSING_DATA.test(text)) return { ok: false, reason: "missing_data" };
  if (GENDERED.some((pattern) => pattern.test(text))) return { ok: false, reason: "gendered" };
  return { ok: true, chapter };
}
