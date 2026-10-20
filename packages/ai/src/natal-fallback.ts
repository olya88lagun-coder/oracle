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
  type NatalBody,
} from "@oracle/content/natal";
import type { ScenarioField } from "@oracle/core";
import { mainAspects, natalChapterOutline, type BodyId, type ChapterPoint, type NatalChapterId, type NatalChapterOutline, type NatalChart } from "@oracle/core/natal";

// Глава натального разбора, собранная без ИИ из готовых текстов: вступление, «Суть» страниц знаков и описания домов
export type NatalChapter = { id: NatalChapterId; source: "fallback"; paragraphs?: string[]; scenario?: Record<ScenarioField, string> };

// Блоки платного разбора: «планета в доме» и «функция планеты». Берутся только из принятых партий; без блока работают запасные тексты
export type NatalBlocks = { house: (body: BodyId, house: number) => string | undefined; planet: (body: BodyId) => string | undefined };
const DEFAULT_BLOCKS: NatalBlocks = { house: houseBlock, planet: planetFunction };

const pageOf = (body: NatalBody, sign: ChapterPoint["sign"]) => natalText(natalPageSlug(body, sign));

function pointParagraphs(point: ChapterPoint, blocks: NatalBlocks): string[] {
  const name = natalPageName(point.body, point.sign);
  const essence = pageOf(point.body, point.sign)?.essence[0];
  // Без дома (асцендент) — только название; без текста «Сути» остаётся одна строка
  const title = point.house === null ? `${name}.` : `${name}, ${point.house} дом.`;
  const lead = essence ? `${title} ${essence}` : title;
  // Если есть блок «планета в доме», он заменяет общее описание дома
  const house = point.house === null ? undefined : (point.body === "ascendant" ? undefined : blocks.house(point.body, point.house)) ?? HOUSE_TEXTS[point.house];
  return house ? [lead, house] : [lead];
}

const orb = (value: number) => value.toFixed(1).replace(".", ",");

function aspectParagraphs(chart: NatalChart, blocks: NatalBlocks): string[] {
  const aspects = mainAspects(chart);
  // Сначала — функции планет, которые участвуют в аспектах (каждая один раз, в порядке появления): они объясняют, что именно связывается
  const bodies = [...new Set(aspects.flatMap((aspect) => [aspect.a, aspect.b]))];
  const functions = bodies.flatMap((body) => {
    const text = blocks.planet(body);
    return text ? [text] : [];
  });
  return [...functions, ...aspects.flatMap((aspect) => [
    `${BODY_NAMES[aspect.a].name} — ${NATAL_ASPECT_NAMES[aspect.aspect]} — ${BODY_NAMES[aspect.b].name} (орбис ${orb(aspect.orb)}°).`,
    ASPECT_TEXTS[aspect.aspect],
  ])];
}

// Поля сценария — из текстов страниц Солнца, Луны и асцендента этой карты: они уже вычитаны владелицей
function scenario(chart: NatalChart): Record<ScenarioField, string> {
  const sun = chart.points.find((point) => point.id === "sun");
  const moon = chart.points.find((point) => point.id === "moon");
  if (!sun || !moon || !chart.ascendant) throw new RangeError("Нужно время рождения");
  const sunText = pageOf("sun", sun.sign);
  const moonText = pageOf("moon", moon.sign);
  const ascText = pageOf("ascendant", chart.ascendant.sign);
  const first = (values: readonly string[] | undefined, index = 0) => values?.[index] ?? "";
  return {
    pattern: first(sunText?.manifestation),
    tension: first(moonText?.pitfalls),
    resource: first(ascText?.manifestation),
    blindSpot: first(sunText?.pitfalls),
    turningPoint: first(ascText?.pitfalls),
    experiment: `Семь дней подряд — одно небольшое действие. Перед ним задайте себе вопрос: ${first(moonText?.questions, 1)}`.trim(),
    question: first(sunText?.questions),
  };
}

function chapterOf(outline: NatalChapterOutline, chart: NatalChart, blocks: NatalBlocks): NatalChapter {
  if (outline.id === "scenario") return { id: outline.id, source: "fallback", scenario: scenario(chart) };
  if (outline.id === "aspects") return { id: outline.id, source: "fallback", paragraphs: [NATAL_CHAPTER_INTROS.aspects, ...aspectParagraphs(chart, blocks)] };
  const extraHouses = outline.houses.flatMap((house) => (HOUSE_TEXTS[house] ? [HOUSE_TEXTS[house]] : []));
  return { id: outline.id, source: "fallback", paragraphs: [NATAL_CHAPTER_INTROS[outline.id], ...outline.points.flatMap((point) => pointParagraphs(point, blocks)), ...extraHouses] };
}

// Девять глав по порядку. Нужно время рождения: без него нет домов и асцендента (natalChapterOutline бросит RangeError)
export function fallbackNatalReport(chart: NatalChart, blocks: NatalBlocks = DEFAULT_BLOCKS): NatalChapter[] {
  return natalChapterOutline(chart).map((outline) => chapterOf(outline, chart, blocks));
}
