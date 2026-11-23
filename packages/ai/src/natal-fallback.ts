import {
  ASPECT_TEXTS,
  BODY_NAMES,
  HOUSE_TEXTS,
  houseBlock,
  NATAL_ASPECT_NAMES,
  NATAL_CHAPTER_INTROS,
  natalPageName,
  natalPageSlug,
  natalText,
  planetFunction,
  SIGN_NAMES,
  type NatalBody,
} from "@oracle/content/natal";
import type { ScenarioField } from "@oracle/core";
import { mainAspects, natalChapterOutline, type BodyId, type ChapterPoint, type HouseDetail, type NatalChapterId, type NatalChapterOutline, type NatalChart } from "@oracle/core/natal";

// Глава натального разбора, собранная без ИИ из готовых текстов: вступление, «Суть» страниц знаков и описания домов
export type NatalChapter = { id: NatalChapterId; source: "ai" | "fallback"; paragraphs?: string[]; scenario?: Record<ScenarioField, string> };

// Блоки платного разбора: «планета в доме» и «функция планеты». Берутся только из принятых партий; без блока работают запасные тексты
export type NatalBlocks = { house: (body: BodyId, house: number) => string | undefined; planet: (body: BodyId) => string | undefined };
const DEFAULT_BLOCKS: NatalBlocks = { house: houseBlock, planet: planetFunction };

const pageOf = (body: NatalBody, sign: ChapterPoint["sign"]) => natalText(natalPageSlug(body, sign));

const OUTER = new Set<ChapterPoint["body"]>(["uranus", "neptune", "pluto"]);

function pointParagraphs(point: ChapterPoint, blocks: NatalBlocks): string[] {
  const name = natalPageName(point.body, point.sign);
  const essence = pageOf(point.body, point.sign)?.essence[0];
  // Без дома (асцендент) — только название; без текста «Сути» остаётся одна строка
  const title = point.house === null ? `${name}.` : `${name}, ${point.house} дом.`;
  // Знак Урана, Нептуна и Плутона общий для поколения: в материал не кладём «Суть» знака, иначе модель читает её как характер
  const lead = OUTER.has(point.body)
    ? `${title} Знак общий для поколения, это не личный характер. Личное звучание задаёт дом.`
    : essence
      ? `${title} ${essence}`
      : title;
  // Если есть блок «планета в доме», он заменяет общее описание дома
  const house = point.house === null ? undefined : (point.body === "ascendant" ? undefined : blocks.house(point.body, point.house)) ?? HOUSE_TEXTS[point.house];
  return house ? [lead, house] : [lead];
}

// «Дом 2 начинается в знаке Телец; его управитель — Венера — стоит в Водолее, в 8 доме.» Это данные карты, а не общий смысл дома
export function houseCuspLine(detail: HouseDetail): string {
  const sign = SIGN_NAMES[detail.rulerSign];
  const where = detail.rulerHouse === null ? "" : detail.rulerHouse === detail.house ? ", в этом же доме" : `, в ${detail.rulerHouse} доме`;
  return `Дом ${detail.house} начинается в знаке ${SIGN_NAMES[detail.cuspSign].nominative}; его управитель — ${BODY_NAMES[detail.ruler].name} — стоит ${sign.preposition} ${sign.prepositional}${where}.`;
}

const orb = (value: number) => value.toFixed(1).replace(".", ",");

function placed(chart: NatalChart, body: BodyId): string {
  const name = BODY_NAMES[body].name;
  const point = chart.points.find((item) => item.id === body);
  if (!point) return name;
  const sign = SIGN_NAMES[point.sign];
  const house = point.house === null ? "" : `, ${point.house} дом`;
  return `${name} ${sign.preposition} ${sign.prepositional}${house}`;
}

function aspectParagraphs(chart: NatalChart, blocks: NatalBlocks): string[] {
  const aspects = mainAspects(chart);
  // Сначала — функции планет, которые участвуют в аспектах (каждая один раз, в порядке появления): они объясняют, что именно связывается
  const bodies = [...new Set(aspects.flatMap((aspect) => [aspect.a, aspect.b]))];
  const functions = bodies.flatMap((body) => {
    const text = blocks.planet(body);
    return text ? [text] : [];
  });
  return [...functions, ...aspects.flatMap((aspect) => [
    `${placed(chart, aspect.a)} — ${NATAL_ASPECT_NAMES[aspect.aspect]} — ${placed(chart, aspect.b)} (орбис ${orb(aspect.orb)}°).`,
    ASPECT_TEXTS[aspect.aspect],
  ])];
}

// «роли, связанные с…» и «ваша работа» — та же формула, которую проверка не пускает в ответ модели
const OCCUPATION_SENTENCE = /(?<![а-яё])(?:професси[а-яё]*|карьер[а-яё]*|ваш[а-яё]*\s+работ[а-яё]*|работ[а-яё]*\s*,?\s*связанн[а-яё]*|рол[а-яё]*\s*,?\s*связанн[а-яё]*)(?![а-яё])/i;
const withoutOccupation = (text: string): string => {
  const kept = text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.trim() && !OCCUPATION_SENTENCE.test(sentence));
  return kept.join(" ").trim();
};

// Поля сценария — из текстов страниц Солнца, Луны и асцендента этой карты: они уже вычитаны владелицей.
// Предложения про профессии из этих страниц в платный итог не попадают: это пересказ «вашей работы», а не сценарий
function scenario(chart: NatalChart): Record<ScenarioField, string> {
  const sun = chart.points.find((point) => point.id === "sun");
  const moon = chart.points.find((point) => point.id === "moon");
  if (!sun || !moon || !chart.ascendant) throw new RangeError("Нужно время рождения");
  const sunText = pageOf("sun", sun.sign);
  const moonText = pageOf("moon", moon.sign);
  const ascText = pageOf("ascendant", chart.ascendant.sign);
  const first = (values: readonly string[] | undefined, index = 0) => values?.[index] ?? "";
  const keep = (text: string, spare: string) => withoutOccupation(text) || spare;
  return {
    pattern: keep(first(sunText?.manifestation), "Может повторяться привычка уходить в глубину там, где другим достаточно поверхности."),
    tension: keep(first(moonText?.pitfalls), "Чужое напряжение легко принять за своё, и тогда силы уходят быстрее, чем заметно."),
    resource: keep(first(ascText?.manifestation), "Опора — пауза перед ответом и право не объяснять себя сразу."),
    blindSpot: keep(first(sunText?.pitfalls), "Легко не заметить, как проверка ситуации превращается в проверку человека."),
    turningPoint: keep(first(ascText?.pitfalls), "Ход меняет короткая теплота в начале разговора: вопрос, а не вывод."),
    experiment: `Каждый вечер в 21:00, за столом, запишите одну строку ответа на вопрос: ${first(moonText?.questions, 1)}`.trim(),
    question: first(sunText?.questions),
  };
}

function chapterOf(outline: NatalChapterOutline, chart: NatalChart, blocks: NatalBlocks): NatalChapter {
  if (outline.id === "scenario") return { id: outline.id, source: "fallback", scenario: scenario(chart) };
  if (outline.id === "aspects") return { id: outline.id, source: "fallback", paragraphs: [NATAL_CHAPTER_INTROS.aspects, ...aspectParagraphs(chart, blocks)] };
  const extraHouses = outline.houseDetails.flatMap((detail) => (HOUSE_TEXTS[detail.house] ? [`${HOUSE_TEXTS[detail.house]} ${houseCuspLine(detail)}`] : []));
  return { id: outline.id, source: "fallback", paragraphs: [NATAL_CHAPTER_INTROS[outline.id], ...outline.points.flatMap((point) => pointParagraphs(point, blocks)), ...extraHouses] };
}

// Девять глав по порядку. Нужно время рождения: без него нет домов и асцендента (natalChapterOutline бросит RangeError)
export function fallbackNatalReport(chart: NatalChart, blocks: NatalBlocks = DEFAULT_BLOCKS): NatalChapter[] {
  return natalChapterOutline(chart).map((outline) => chapterOf(outline, chart, blocks));
}
