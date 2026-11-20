import { findViolations } from "./moon";

// Тексты этапов 3 и 4 лунного раздела: затмения, ретроградный Меркурий и Венера, каталог 30 лунных суток.
// Тексты пишет Claude, принимает владелица (как тексты «Луны сегодня»). Пока флаг false, страницы показывают только данные: таблицы, даты, номера и символы суток.
// Язык: описание небесных явлений, без оценок дней и без советов по здоровью, деньгам и свиданиям.
export const MOON_EVENTS_TEXTS_ACCEPTED = false;

export type Faq = { question: string; answer: string }[];

const TIME_NOTE = "Время указано по Москве (UTC+3); в другом городе оно сдвигается на разницу часовых поясов.";

// В году бывает от двух до семи затмений: «затмения» для 2–4, «затмений» для 5–7
const eclipseNoun = (count: number): string => (count >= 2 && count <= 4 ? "затмения" : "затмений");

export type EclipseFacts = {
  year: number;
  // Подписи вида «17 февраля, 15:12 — кольцеобразное солнечное затмение»
  all: string[];
  visible: string[];
  partial: string[];
  hasPenumbralVisible: boolean;
};

export function eclipseIntro(year: number): string {
  return `Затмение — момент, когда Солнце, Земля и Луна выстраиваются почти в одну линию. В лунное затмение Луна проходит через тень Земли, в солнечное — Луна закрывает Солнце от наблюдателя. Ниже — все затмения ${year} года по Москве: тип, момент максимума, знак зодиака, в котором стояла Луна, и видно ли затмение из Москвы.`;
}

export function eclipseFaq(facts: EclipseFacts): Faq {
  const visibility = [
    facts.visible.length ? `Видно из Москвы в максимум: ${facts.visible.join("; ")}.` : "",
    facts.partial.length ? `Видно частично (Солнце или Луна над горизонтом только часть затмения): ${facts.partial.join("; ")}.` : "",
    facts.visible.length + facts.partial.length < facts.all.length ? "Остальные из Москвы не видны: в этот момент светило под горизонтом." : "",
    facts.hasPenumbralVisible ? "Полутеневое лунное затмение заметно глазу слабо: Луна лишь немного тускнеет." : "",
  ].filter(Boolean);
  return [
    { question: `Сколько затмений в ${facts.year} году?`, answer: `В ${facts.year} году ${facts.all.length} ${eclipseNoun(facts.all.length)}: ${facts.all.join("; ")}. ${TIME_NOTE}` },
    { question: "Чем лунное затмение отличается от солнечного?", answer: "Лунное затмение бывает в полнолуние: Луна проходит через тень Земли и видна из любой точки ночной стороны Земли, где она над горизонтом. Солнечное бывает в новолуние: Луна закрывает Солнце, и полное затмение видно только в узкой полосе, а вокруг неё — частное." },
    { question: "Почему затмений меньше, чем новолуний и полнолуний?", answer: "Орбита Луны наклонена к плоскости орбиты Земли примерно на пять градусов, поэтому в большинство новолуний и полнолуний Луна проходит выше или ниже линии Солнце — Земля. Затмение случается, только когда фаза совпадает с пересечением этих плоскостей." },
    { question: `Видно ли затмения ${facts.year} года из Москвы?`, answer: visibility.join(" ") },
  ];
}

export type RetrogradePlanetName = { nominative: string; genitive: string };
export type RetrogradeFacts = { planet: "mercury" | "venus"; year: number; names: RetrogradePlanetName; periods: string[] };

export function retrogradeIntro(names: RetrogradePlanetName, year: number): string {
  return `Ретроградное движение — кажущееся обратное движение планеты на фоне звёзд: если смотреть с Земли, планета на время «пятится» по зодиаку. На самом деле она не меняет направления: так выглядит обгон одной планеты другой на их орбитах. Ниже — периоды ретроградного движения ${names.genitive} в ${year} году с точным временем смены направления по Москве.`;
}

export function retrogradeFaq(facts: RetrogradeFacts): Faq {
  const { names, year, planet } = facts;
  const often = planet === "mercury" ? "Меркурий бывает ретроградным три-четыре раза в год, каждый раз около трёх недель." : "Венера бывает ретроградной примерно раз в 19 месяцев (584 суток), каждый раз около шести недель.";
  const theme = planet === "mercury" ? "пересмотра и возвращения к прошлому" : "ценностей и близких отношений";
  const adjective = planet === "venus" ? "ретроградная" : "ретроградный";
  const instrumental = planet === "venus" ? "ретроградной" : "ретроградным";
  return [
    { question: `Когда ${names.nominative} ${adjective} в ${year} году?`, answer: `${facts.periods.length ? facts.periods.join("; ") : `В ${year} году периодов обратного движения нет`}. ${TIME_NOTE}` },
    { question: `Что значит ${adjective} ${names.nominative}?`, answer: `Это астрономическое явление: планета на время кажется движущейся назад, хотя её орбитальное движение не меняется. Символическая традиция связывает такой период с темой ${theme}, но календарь не обещает ни событий, ни их исхода.` },
    { question: `Как часто ${names.nominative} бывает ${instrumental}?`, answer: often },
  ];
}

export const DAYS_HUB_INTRO =
  "Лунные сутки — шаги лунного месяца: в одном цикле их 29 или 30. Первые начинаются в момент новолуния, следующие — с восхода Луны. У каждых суток в традиции есть свой символ; здесь для каждых — образ, вопрос к себе и ближайшие даты, когда они придутся на календарь. Символы суток в разных источниках расходятся, мы берём одну из распространённых традиций.";

export const DAYS_HUB_FAQ: Faq = [
  { question: "Сколько лунных суток в месяце?", answer: "В лунном месяце 29 или 30 суток: между новолуниями около 29,5 обычных суток, поэтому 30-е сутки бывают не каждый месяц." },
  { question: "Почему лунные сутки начинаются не в полночь?", answer: "Первые сутки начинаются в момент новолуния, следующие — с восхода Луны в вашем городе, а восход Луны смещается в среднем примерно на 50 минут в день. Поэтому календарное время начала суток меняется, а номер суток в разных городах может различаться." },
];

export const DAY_PAGE_NOTE =
  "Лунные сутки начинаются с восхода Луны (первые — с момента новолуния) и длятся до следующего восхода, поэтому календарное время их начала зависит от города. Даты ниже даны по Москве на полдень.";

const SAMPLE_FACTS: EclipseFacts = { year: 2026, all: ["3 марта, 14:33 — полное лунное затмение", "12 августа, 20:45 — полное солнечное затмение"], visible: [], partial: ["12 августа"], hasPenumbralVisible: true };

export function checkMoonEventsTexts(): string[] {
  const names = { nominative: "Меркурий", genitive: "Меркурия" };
  return findViolations([
    { id: "eclipse intro", fields: [eclipseIntro(2026)] },
    ...eclipseFaq(SAMPLE_FACTS).map((item, index) => ({ id: `eclipse faq ${index + 1}`, fields: [item.question, item.answer] })),
    { id: "retrograde intro", fields: [retrogradeIntro(names, 2026)] },
    ...(["mercury", "venus"] as const).flatMap((planet) => retrogradeFaq({ planet, year: 2026, names: planet === "mercury" ? names : { nominative: "Венера", genitive: "Венеры" }, periods: ["с 26 февраля, 03:00 (в Рыбах) до 20 марта, 12:00 (в Рыбах)"] }).map((item, index) => ({ id: `${planet} faq ${index + 1}`, fields: [item.question, item.answer] }))),
    { id: "days hub", fields: [DAYS_HUB_INTRO, DAY_PAGE_NOTE, ...DAYS_HUB_FAQ.flatMap((item) => [item.question, item.answer])] },
  ]);
}
