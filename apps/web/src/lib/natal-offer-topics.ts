import type { NatalChapterId } from "@oracle/core/natal-report";

// «Что для вас сейчас важнее всего?» в блоке продажи разбора: человек выбирает тему, и в оглавлении отмечается подходящая глава.
// Порядок глав в разборе от выбора не зависит; выбор нигде не сохраняется и никуда не отправляется — он живёт в блоке до перезагрузки страницы.

export type OfferTopicId = "self" | "love" | "work" | "action" | "growth" | "depth";
export type OfferTopic = { id: OfferTopicId; label: string; chapter: NatalChapterId };

export const OFFER_TOPIC_QUESTION = "Что для вас сейчас важнее всего?";
export const OFFER_TOPIC_GROUP_LABEL = "Тема, которая вам сейчас ближе";

export const OFFER_TOPICS: readonly OfferTopic[] = [
  { id: "self", label: "Самопознание", chapter: "core" },
  { id: "love", label: "Любовь и отношения", chapter: "love" },
  { id: "work", label: "Деньги и дело", chapter: "work" },
  { id: "action", label: "Энергия и действие", chapter: "action" },
  { id: "growth", label: "Рост и трудности", chapter: "growth" },
  { id: "depth", label: "Глубинные темы", chapter: "depth" },
];

// Нажатие на выбранную тему снимает выбор, на другую — переключает
export const toggleTopic = (current: OfferTopicId | null, clicked: OfferTopicId): OfferTopicId | null => (current === clicked ? null : clicked);

// Номер главы в оглавлении (с единицы) для выбранной темы; null — темы нет или такой главы в списке нет
export function chapterNumberFor(topic: OfferTopicId | null, outline: readonly { id: NatalChapterId }[]): number | null {
  const chapter = OFFER_TOPICS.find((item) => item.id === topic)?.chapter;
  if (!chapter) return null;
  const index = outline.findIndex((item) => item.id === chapter);
  return index === -1 ? null : index + 1;
}

export const pickedNote = (number: number, title: string): string => `Отмечено в оглавлении: глава ${number} «${title}». Порядок глав в разборе не меняется.`;
export const PICKED_MARK = "Ваша тема";
