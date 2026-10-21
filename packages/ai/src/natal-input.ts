import type { ScenarioField } from "@oracle/core";
import { NATAL_CHAPTER_TITLES, type NatalChapterId, type NatalChart } from "@oracle/core/natal";
import { fallbackNatalReport, type NatalBlocks } from "./natal-fallback";

// Всё, что уходит модели в натальном разборе: тема главы, вступление и готовые тексты о положениях планет, домах и аспектах этой карты.
// Имени, даты, времени, места рождения и идентификаторов здесь нет: из карты берутся только знаки, дома и аспекты, а тексты про них — общие.
// material — те же абзацы, из которых без ИИ собирается запасная глава; у итоговой главы вместо них scenarioDraft (черновик полей из текстов страниц)
export type NatalChapterInput = {
  chapter: NatalChapterId;
  title: string;
  intro: string;
  material: string[];
  scenarioDraft?: Record<ScenarioField, string>;
  previous?: string[];
};

// Девять глав по порядку; итоговая — последняя. Нужно время рождения (иначе RangeError из fallbackNatalReport)
export function buildNatalChapterInputs(chart: NatalChart, blocks?: NatalBlocks): NatalChapterInput[] {
  return fallbackNatalReport(chart, blocks).map((chapter): NatalChapterInput => {
    const title = NATAL_CHAPTER_TITLES[chapter.id];
    if (chapter.scenario) return { chapter: chapter.id, title, intro: "", material: [], scenarioDraft: chapter.scenario };
    const [intro = "", ...material] = chapter.paragraphs ?? [];
    return { chapter: chapter.id, title, intro, material };
  });
}
