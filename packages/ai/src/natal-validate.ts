import { findStopPhrases } from "@oracle/content";
import type { NatalChapterInput } from "./natal-input";
import { natalProseLimits } from "./natal-prompt";
import type { NatalChapter } from "./natal-fallback";
import { extractJson, readProse, readScenario, type ValidationFailure } from "./validate";

// Модель иногда пишет, что данных о доме нет («информация о положении планет в этом доме отсутствует»): читателю это не нужно
const MISSING_DATA = /отсутству|нет\s+(данных|информации|сведений)|недостаточно\s+(данных|информации)|(данных|информации|сведений)[^.]{0,40}недостаточно|не\s+(указан|известн)/i;
// Слова-связки, которыми модель забивает текст: «стоит заметить», «важно отметить», «таким образом». Один раз допустим, два и больше — штамп.
// Раньше сам промпт подсказывал «стоит заметить» как образец, и эти обороты стояли почти в каждой главе
const FILLER = /(?<![а-яё])(стоит|следует|важно|интересно|необходимо)\s+(заметить|отметить)(?![а-яё])|(?<![а-яё])таким\s+образом(?![а-яё])/gi;
const FILLER_LIMIT = 1;
// Предложения, начатые с «Важно» («Важно помнить…», «Важно осознавать…»), и абзацы, начатые с «Однако»: после запрета «стоит заметить» модель стала писать так в каждой главе
const SENTENCE_START = (word: string) => new RegExp(String.raw`(?:^|[.!?…]\s+|\n)${word}(?![а-яё])`, "gi");
const IMPORTANT_OPENERS = SENTENCE_START("важно");
const HOWEVER_OPENERS = SENTENCE_START("однако");
const IMPORTANT_LIMIT = 1;
const HOWEVER_LIMIT = 2;
// Последний абзац, который пересказывает главу («Вместе эти элементы создают образ…», «Таким образом…», «В целом…»): читателю он ничего не добавляет
const RECAP_START = /^(вместе\s+(эти|они|положения)|в\s+целом|таким\s+образом|сочетание\s+(этих|двух|трёх|[а-яё]+\s+и\s+[а-яё]+)|эти\s+(аспекты|элементы|положения|позиции|факторы)\s+(вместе\s+)?(создают|формируют|образуют|показывают))/i;
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
    const read = readProse(raw, natalProseLimits(input.chapter));
    if (!read.ok) return read;
    chapter = { id: input.chapter, source: "ai", paragraphs: read.paragraphs };
  }
  const text = [...(chapter.paragraphs ?? []), ...Object.values(chapter.scenario ?? {})].join("\n");
  if (findStopPhrases(text).length > 0) return { ok: false, reason: "stop_words" };
  if (MISSING_DATA.test(text)) return { ok: false, reason: "missing_data" };
  if (GENDERED.some((pattern) => pattern.test(text))) return { ok: false, reason: "gendered" };
  if ((text.match(FILLER) ?? []).length > FILLER_LIMIT) return { ok: false, reason: "filler" };
  if ((text.match(IMPORTANT_OPENERS) ?? []).length > IMPORTANT_LIMIT || (text.match(HOWEVER_OPENERS) ?? []).length > HOWEVER_LIMIT) return { ok: false, reason: "filler" };
  const last = chapter.paragraphs?.at(-1);
  if (last && RECAP_START.test(last)) return { ok: false, reason: "filler" };
  return { ok: true, chapter };
}
