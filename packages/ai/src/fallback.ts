import { SECTION_TITLES } from "@oracle/content";
import type { ChapterArcanum, ChapterInput } from "./input";
import type { GeneratedChapter } from "./writer";

const LIST_TITLES = new Set<string>([SECTION_TITLES.resource, SECTION_TITLES.distortion]);

const block = (arcanum: ChapterArcanum | undefined, title: string): readonly string[] => arcanum?.blocks[title] ?? [];

function arcanumParagraphs(arcanum: ChapterArcanum, labelled: boolean): string[] {
  const label = `${capitalize(arcanum.role)} — ${arcanum.number} ${arcanum.name}.`;
  // Блок, который уже был выше, дословно не повторяем
  const fresh = Object.entries(arcanum.blocks).filter(([title]) => !arcanum.seen?.[title]);
  const earlier = Object.values(arcanum.seen ?? {})[0];
  if (earlier && fresh.length === 0) {
    return [`${label} Этот аркан уже разобран выше, в позиции «${earlier}»: смысл образа тот же. Здесь важно, как он работает в роли «${arcanum.role}»: чем она отличается от первой и какой вопрос задаёт именно вам.`];
  }
  const paragraphs = fresh.flatMap(([title, texts]) => (LIST_TITLES.has(title) ? [`${title}: ${texts.join(", ")}.`] : [...texts]));
  // В главах с несколькими арканами читателю нужно видеть, о какой точке абзац
  if (labelled && paragraphs[0]) paragraphs[0] = `${label} ${paragraphs[0]}`;
  return paragraphs;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function scenario(input: ChapterInput): GeneratedChapter {
  const center = input.arcana[0];
  const resource = block(center, SECTION_TITLES.resource);
  const distortion = block(center, SECTION_TITLES.distortion);
  return {
    id: "scenario",
    source: "fallback",
    scenario: {
      pattern: `Когда центр уходит в перекос, может повторяться знакомый сценарий: ${distortion.join(", ")}.`,
      tension: `Напряжение возникает между двумя полюсами центра. Опора — «${resource[0] ?? ""}». Перекос — «${distortion[0] ?? ""}». Оба состояния знакомы, и выбор между ними часто происходит незаметно.`,
      resource: `На что можно опереться: ${resource.join(", ")}.`,
      blindSpot: `Легко не замечать, как перекос становится нормой. Например: «${distortion[1] ?? distortion[0] ?? ""}».`,
      turningPoint: `Точка изменения — заметить момент, когда появляется «${distortion[0] ?? ""}», и сделать один шаг к опоре: «${resource[0] ?? ""}».`,
      experiment: `Семь дней подряд — одно небольшое действие. ${block(center, SECTION_TITLES.action)[0] ?? ""}`.trim(),
      question: block(center, SECTION_TITLES.question)[0] ?? "Что для вас сейчас важнее всего?",
    },
  };
}

// Глава без ИИ: описание позиции и вычитанные тексты арканов как есть. Нужна, если модель не ответила или ответ не прошёл проверку
export function fallbackChapter(input: ChapterInput): GeneratedChapter {
  if (input.chapter === "scenario") return scenario(input);
  const labelled = input.arcana.length > 1;
  return { id: input.chapter, source: "fallback", paragraphs: [input.position, ...input.arcana.flatMap((arcanum) => arcanumParagraphs(arcanum, labelled))] };
}
