import { findViolations } from "./moon";

// Вступление и шаблоны ответов для страниц лунного календаря пишет Claude, вычитывает и принимает владелица (как тексты «Луны сегодня»): приняты 17 ноября 2026.
// Правка текстов после приёмки — только с её согласия; при сомнении верните MOON_CALENDAR_TEXTS_ACCEPTED в false, и страница покажет только данные (сетку, даты, таблицы).
// Язык описания: без оценок дней, без советов по здоровью, деньгам и свиданиям.
export const MOON_CALENDAR_TEXTS_ACCEPTED = true;

export const MONTH_INTRO =
  "Лунный календарь показывает, как Луна меняется день за днём: фазу и освещённость, лунные сутки и знак зодиака. Расчёт сделан для Москвы. Календарь описывает положение Луны и служит поводом спросить себя, чего вам хочется в этом месяце, а не прогнозом событий.";

export type PhaseKind = "new" | "firstQuarter" | "full" | "lastQuarter";
// month — название в именительном падеже, monthLocative — в предложном («ноябре»); events — метки времени по Москве в порядке месяца
export type MonthFacts = { month: string; monthLocative: string; year: number; events: Record<PhaseKind, string[]> };
export type FaqTemplate = { question: (monthLocative: string, year: number) => string; answer: (facts: MonthFacts) => string };

const TIME_NOTE = "Время указано по Москве (UTC+3), в других городах оно сдвигается на разницу часовых поясов.";

const when = (facts: MonthFacts) => `${facts.monthLocative} ${facts.year} года`;

export const MONTH_FAQ_TEMPLATES: readonly FaqTemplate[] = [
  {
    question: (month, year) => `Когда новолуние в ${month} ${year}?`,
    answer: (facts) => {
      const dates = facts.events.new;
      if (dates.length === 0) return `В ${when(facts)} новолуния нет: оно приходится на соседний месяц. В новолуние Луна не видна на небе, а лунный месяц начинается заново. ${TIME_NOTE}`;
      return `Новолуние в ${when(facts)} — ${dates.join(" и ")} по Москве. В это время Луна не видна на небе: её освещённая сторона обращена от Земли, а лунный месяц начинается заново. ${TIME_NOTE}`;
    },
  },
  {
    question: (month, year) => `Когда полнолуние в ${month} ${year}?`,
    answer: (facts) => {
      const dates = facts.events.full;
      if (dates.length === 0) return `В ${when(facts)} полнолуния нет: оно приходится на соседний месяц. В полнолуние диск Луны освещён целиком. ${TIME_NOTE}`;
      if (dates.length > 1) return `В ${when(facts)} два полнолуния: ${dates.join(" и ")} по Москве. Второе полнолуние в одном календарном месяце иногда называют «голубой Луной». ${TIME_NOTE}`;
      return `Полнолуние в ${when(facts)} — ${dates[0]} по Москве. В это время диск Луны освещён целиком и виден всю ночь. ${TIME_NOTE}`;
    },
  },
  {
    question: (month, year) => `Какие фазы Луны в ${month} ${year}?`,
    answer: (facts) => {
      const labels: [PhaseKind, string][] = [["new", "Новолуние"], ["firstQuarter", "Первая четверть"], ["full", "Полнолуние"], ["lastQuarter", "Последняя четверть"]];
      const parts = labels.flatMap(([kind, name]) => (facts.events[kind].length ? [`${name} — ${facts.events[kind].join(" и ")}`] : []));
      return `Главные фазы Луны в ${when(facts)}: ${parts.join("; ")}. Между ними Луна растёт или убывает, и каждый день показан в сетке календаря. ${TIME_NOTE}`;
    },
  },
  {
    question: () => "Как читать лунный календарь?",
    answer: () =>
      "Сетка показывает каждый день месяца: маленькая Луна — это фаза на полдень по Москве, число с «л. с.» — номер лунных суток, ниже стоит знак зодиака, в котором находится Луна. Календарь описывает положение Луны и не предсказывает событий: он не делит дни на удачные и неудачные.",
  },
];

// Пример данных для проверки текстов
const SAMPLE: MonthFacts = { month: "ноябрь", monthLocative: "ноябре", year: 2026, events: { new: ["9 ноября, 10:02"], firstQuarter: ["17 ноября, 14:47"], full: ["24 ноября, 17:53"], lastQuarter: ["1 ноября, 23:28"] } };

export function checkMoonCalendarTexts(): string[] {
  return findViolations([
    { id: "intro", fields: [MONTH_INTRO] },
    ...MONTH_FAQ_TEMPLATES.map((template, index) => ({ id: `faq ${index + 1}`, fields: [template.question(SAMPLE.monthLocative, SAMPLE.year), template.answer(SAMPLE)] })),
  ]);
}

export function monthIntro(): string | undefined {
  return MOON_CALENDAR_TEXTS_ACCEPTED ? MONTH_INTRO : undefined;
}
