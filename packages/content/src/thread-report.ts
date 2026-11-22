import { personalMonthsOf, type LifeThread, type ThreadBlock, type ThreadChapter, type ThreadYear } from "@oracle/core";
import type { NumerologySection, NumerologyText } from "./numerology";
import type { NumerologyKind } from "./numerology-manifest";
import {
  THREAD_MONTH_AGAIN,
  THREAD_MONTHS_GENITIVE,
  THREAD_NOW_INTRO,
  THREAD_PAST_INTRO,
  THREAD_PAST_INTRO_SHORT,
  THREAD_PERIOD_POSITIONS,
  THREAD_PERIOD_ROMAN,
  THREAD_RHYTHM_CYCLE,
  THREAD_RHYTHM_INTRO,
  THREAD_RHYTHM_NEXT,
  THREAD_RHYTHM_NOW_PEAK,
  THREAD_RHYTHM_PAST,
  THREAD_RHYTHM_POSITION,
  THREAD_YEAR_NAMES,
} from "./thread-report-texts";

export type ThreadTextReader = (kind: NumerologyKind, key: string) => NumerologyText | undefined;

const PEAK = 8;
const FUTURE_YEARS = 7;
const PAST_YEARS = 4;

// «15 июля» из ISO-даты; год в заголовках месяцев не пишем: внутри личного года он очевиден
const day = (iso: string): string => `${Number(iso.slice(8, 10))} ${THREAD_MONTHS_GENITIVE[Number(iso.slice(5, 7)) - 1] ?? ""}`;
const dayYear = (iso: string): string => `${day(iso)} ${iso.slice(0, 4)}`;
const yearHeading = (y: ThreadYear): string => `${y.year} · год ${y.value} · ${THREAD_YEAR_NAMES[y.value] ?? ""}`;

// Нет текста — ошибка: воркер её залогирует, а в разборе не появится дыра
function need(read: ThreadTextReader, kind: NumerologyKind, key: string): NumerologyText {
  const text = read(kind, key);
  if (!text) throw new Error(`thread report: missing ${kind}-${key}`);
  return text;
}

function section(text: NumerologyText, title: string): NumerologySection {
  const found = text.sections.find((s) => s.title === title);
  if (!found) throw new Error(`thread report: missing section ${text.kind}-${text.key}/${title}`);
  return found;
}

const paragraphsOf = (text: NumerologyText, title: string): string[] => [...section(text, title).paragraphs];
const firstOf = (text: NumerologyText, title: string): string[] => paragraphsOf(text, title).slice(0, 1);
// Пункты списка важнее абзацев: в «Вопросах себе» и «Трёх правилах» суть лежит в них
const itemsOf = (text: NumerologyText, title: string): string[] => {
  const s = section(text, title);
  return s.items.length ? [...s.items] : [...s.paragraphs];
};

// Число месяца в течение года повторяется (девять чисел на двенадцать месяцев): тот же абзац второй раз не печатаем, а отсылаем к первому месяцу с этим числом
function monthBlocks(thread: LifeThread, current: ThreadYear, read: ThreadTextReader): ThreadBlock[] {
  const firstHeading = new Map<number, string>();
  return personalMonthsOf(thread.birth, current).map((m): ThreadBlock => {
    const heading = `${day(m.start)} — ${day(m.end)}`;
    const earlier = firstHeading.get(m.value);
    if (earlier) return { heading, paragraphs: [THREAD_MONTH_AGAIN(m.value, earlier)] };
    firstHeading.set(m.value, heading);
    return { heading, paragraphs: paragraphsOf(need(read, "month", String(m.value)), "Тема месяца") };
  });
}

export function buildThreadReport(thread: LifeThread, read: ThreadTextReader): ThreadChapter[] {
  const current = thread.years.find((y) => y.year === thread.currentYear);
  if (!current) throw new Error("thread report: no current year");
  const year = (n: number): ThreadYear | undefined => thread.years.find((y) => y.year === n);

  const yearText = need(read, "thread", String(current.value));
  const now: ThreadBlock[] = [
    { paragraphs: [THREAD_NOW_INTRO(current.value, dayYear(current.start), dayYear(current.end))] },
    { heading: yearHeading(current), paragraphs: [...paragraphsOf(yearText, "Тема года"), ...paragraphsOf(yearText, "На что опереться")] },
    ...monthBlocks(thread, current, read),
  ];

  const years: ThreadBlock[] = [];
  for (let n = current.year + 1; n <= current.year + FUTURE_YEARS; n++) {
    const y = year(n);
    if (!y) continue;
    const text = need(read, "thread", String(y.value));
    years.push({ heading: yearHeading(y), paragraphs: [...firstOf(text, "Тема года"), ...firstOf(text, "Где осторожнее")] });
  }

  const pastBlocks: ThreadBlock[] = [];
  for (let n = current.year - PAST_YEARS; n < current.year; n++) {
    const y = year(n);
    if (y) pastBlocks.push({ heading: yearHeading(y), paragraphs: itemsOf(need(read, "past", String(y.value)), "Вопросы себе") });
  }
  const past: ThreadBlock[] = [{ paragraphs: [pastBlocks.length ? THREAD_PAST_INTRO : THREAD_PAST_INTRO_SHORT] }, ...pastBlocks];

  const currentPeriod = thread.periods.find((p) => current.year >= p.fromYear && (p.toYear === null || current.year < p.toYear));
  const periods = thread.periods.map((p): ThreadBlock => {
    const text = need(read, "period", String(p.value));
    // Граница нужна там, где человек стоит сейчас, и впереди; позади она уже пройдена
    const border = currentPeriod !== undefined && (p.index === currentPeriod.index || p.index === currentPeriod.index + 1);
    return {
      heading: `${THREAD_PERIOD_ROMAN[p.index]} период · ${THREAD_PERIOD_POSITIONS[p.index]} · ${p.toYear === null ? `с ${p.fromYear}` : `${p.fromYear}–${p.toYear}`}`,
      paragraphs: [...firstOf(text, "Сила периода"), ...firstOf(text, "Трудность периода"), ...(border ? paragraphsOf(text, "Как пройти границу") : [])],
    };
  });

  // Вершины — годы со значением 8: прошлая — последняя до нынешнего года, ближайшая — первая после (окно расчёта уходит минимум на девять лет вперёд)
  const peaks = thread.years.filter((y) => y.value === PEAK);
  const lastPeak = peaks.filter((y) => y.year < current.year).at(-1);
  const nextPeak = peaks.find((y) => y.year > current.year);
  const rhythm: string[] = [THREAD_RHYTHM_INTRO, THREAD_RHYTHM_POSITION(current.value)];
  if (current.value === PEAK) rhythm.push(THREAD_RHYTHM_NOW_PEAK);
  if (lastPeak) rhythm.push(THREAD_RHYTHM_PAST(lastPeak.year));
  if (nextPeak) rhythm.push(THREAD_RHYTHM_NEXT(nextPeak.year, nextPeak.year - current.year));
  rhythm.push(THREAD_RHYTHM_CYCLE);

  const rulesText = need(read, "rules", String(current.value));
  const rules: ThreadBlock[] = [
    { heading: `Три правила года ${current.value}`, paragraphs: itemsOf(rulesText, "Три правила") },
    { heading: "Вопрос на год", paragraphs: paragraphsOf(rulesText, "Вопрос на год") },
  ];

  return [
    { id: "now", source: "fallback", blocks: now },
    { id: "years", source: "fallback", blocks: years },
    { id: "past", source: "fallback", blocks: past },
    { id: "periods", source: "fallback", blocks: periods },
    { id: "rhythm", source: "fallback", blocks: [{ paragraphs: rhythm }] },
    { id: "rules", source: "fallback", blocks: rules },
  ];
}
