import type { FaqItem } from "@/components/moon/MoonPageParts";
import { dayOrdinal } from "./day-ordinal";
import type { DatePage } from "./lunar-day-page";

// Шаблонные тексты страницы одной даты. Всё собирается из чисел дня: у каждой даты свои заголовок, описание и ответ.
// Слов-оценок и обещаний нет; время по Москве
const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);
const percentOf = (page: DatePage): number => Math.round(page.illumination * 100);

// Чем ведёт день: главная фаза, вход Луны в новый знак или просто фаза. Название фазы уже учитывает события дня: рядом с главной фазой это «около полнолуния»
function lead(page: DatePage): string {
  if (page.mainEvent) return lowerFirst(page.mainEvent.name);
  if (page.signChange) return `переход в знак ${page.signChange.signName}`;
  return lowerFirst(page.phaseName);
}

// «Луна входит в знак Близнецы в 14:09»: знак называем в момент перехода, а не на полдень
const enters = (page: DatePage): string | null => (page.signChange ? `Луна входит в знак ${page.signChange.signName} в ${page.signChange.time}` : null);

export const dateTitle = (page: DatePage): string => `Луна ${page.dateLabel}: ${lead(page)}, ${page.lunarLine}`;

export function dateDescription(page: DatePage): string {
  const signLed = !page.mainEvent && page.signChange !== null;
  const what = page.mainEvent ? `${lead(page)} в ${page.mainEvent.time}` : signLed ? enters(page) : lead(page);
  const rise = page.rise ? `восход в ${page.rise} по Москве` : "Луна в этот день не восходит";
  return `Луна ${page.dateLabel}: ${what}, освещено ${percentOf(page)} %, ${page.lunarLine}, ${signLed ? "" : `${enters(page) ?? page.signLine}, `}${rise}. Бесплатно.`;
}

// Восход и заход одним предложением; бывают сутки без восхода или без захода
function riseSet(page: DatePage): string {
  if (page.rise && page.set) return `Восходит в ${page.rise}, заходит в ${page.set} (по Москве).`;
  if (page.rise) return `Восходит в ${page.rise} по Москве, в этот день не заходит.`;
  if (page.set) return `Луна в этот день не восходит, заходит в ${page.set} по Москве.`;
  return "Луна в этот день не восходит и не заходит.";
}

export function dateAnswer(page: DatePage): string {
  const opening = page.mainEvent
    ? `${page.dateLabel} — ${lowerFirst(page.mainEvent.name)} в ${page.mainEvent.time}.`
    : page.signChange
      ? `${page.dateLabel} — ${enters(page)}.`
      : `${page.dateLabel} — ${lead(page)}.`;
  // Когда Луна в этот день меняет знак, знак на полдень не называем: он совпал бы с новым или противоречил бы ему
  const state = `Луна освещена на ${percentOf(page)} %, идут ${page.lunarLine}${page.signChange ? "" : `, ${page.signLine}`}.`;
  // Вход в знак отдельным предложением, когда день уже ведёт главная фаза
  const sign = page.mainEvent && page.signChange ? ` ${enters(page)}.` : "";
  return `${opening} ${state}${sign} ${riseSet(page)}`;
}

export function dateFaq(page: DatePage): FaqItem[] {
  const symbol = page.lunarSymbol ? ` (символ «${page.lunarSymbol}»)` : "";
  const change = page.lunarChange ? `В ${page.lunarChange.time} по Москве начинаются ${dayOrdinal(page.lunarChange.to)} лунные сутки.` : "В течение дня они не меняются.";
  return [
    { question: `Какая Луна ${page.dateLabel}?`, answer: dateAnswer(page) },
    { question: `Какие лунные сутки ${page.dateLabel}?`, answer: `${page.dateLabel} идут ${page.lunarLine}${symbol}. ${change}` },
    { question: `Во сколько восход и заход Луны ${page.dateLabel}?`, answer: riseSet(page) },
  ];
}
