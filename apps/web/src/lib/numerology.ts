import { acceptedNumerologyPages } from "@oracle/content/numerology";
import { calculateFateNumber, calculatePersonalYear, CLOCK_TIMES, type ClockTime, type FateNumber, type PersonalYear } from "@oracle/core";
import { reachGoal, type Goal } from "./analytics";
import { isAnalyticsReady } from "./analytics-runtime";
import { DATE_ERROR } from "./matrix-save";

// Раздел «Нумерология» (docs/superpowers/specs/2026-11-08-numerology-design.md): калькулятор числа судьбы и страницы чисел
export const NUMEROLOGY_PATH = "/numerologiya";
export const fatePath = (n: number): string => `${NUMEROLOGY_PATH}/chislo-sudby/${n}`;

// Только принятые партии: у непринятых страниц нет адреса в карте сайта и ссылок
export function acceptedFatePaths(): string[] {
  return acceptedNumerologyPages("fate").map((page) => fatePath(Number(page.key)));
}

export type FateOutcome = { ok: true; iso: string; result: FateNumber } | { ok: false; error: string };

export function fateOutcome(iso: string, today: Date): FateOutcome {
  const result = calculateFateNumber(iso, today);
  return result ? { ok: true, iso, result } : { ok: false, error: DATE_ERROR };
}

export const PERSONAL_YEAR_PATH = `${NUMEROLOGY_PATH}/lichnyy-god-2027`;
export const personalYearPath = (n: number): string => `${PERSONAL_YEAR_PATH}/${n}`;

export function acceptedPersonalYearPaths(): string[] {
  return acceptedNumerologyPages("year").map((page) => personalYearPath(Number(page.key)));
}

export type PersonalYearOutcome = { ok: true; iso: string; result: PersonalYear } | { ok: false; error: string };

export function personalYearOutcome(iso: string, today: Date): PersonalYearOutcome {
  const result = calculatePersonalYear(iso, today);
  return result ? { ok: true, iso, result } : { ok: false, error: DATE_ERROR };
}

export const CLOCK_PATH = `${NUMEROLOGY_PATH}/chasy`;
export const clockPath = (slug: string): string => `${CLOCK_PATH}/${slug}`;

export function acceptedClockPaths(): string[] {
  return acceptedNumerologyPages("clock").map((page) => clockPath(page.key));
}

const sameGroup = (a: ClockTime, b: ClockTime): boolean => a.kind === "both" || b.kind === "both" || a.kind === b.kind;

// 2–3 ближайших по времени суток принятых времени той же группы — ряд «Другие значения»
export function relatedClocks(slug: string): readonly ClockTime[] {
  const self = CLOCK_TIMES.find((time) => time.slug === slug);
  if (!self) return [];
  const accepted = new Set(acceptedNumerologyPages("clock").map((page) => page.key));
  const at = (t: ClockTime) => t.hours * 60 + t.minutes;
  return CLOCK_TIMES.filter((time) => time !== self && accepted.has(time.slug) && sameGroup(self, time))
    .sort((a, b) => Math.abs(at(a) - at(self)) - Math.abs(at(b) - at(self)))
    .slice(0, 3)
    .sort((a, b) => at(a) - at(b));
}

type NumerologyGoal = Extract<Goal, `numerology_${string}` | `personal_year_${string}`>;

// Как у аркана года: клики до согласия и готовности счётчика не досылаем
export function reachNumerologyGoal(goal: NumerologyGoal): boolean {
  return isAnalyticsReady() && reachGoal(goal);
}

export const FATE_FAQ = [
  { question: "Как рассчитать число судьбы по дате рождения?", answer: "Сложите все цифры полной даты рождения и сворачивайте сумму сложением цифр, пока не получится число от 1 до 9. Если на любом шаге вышло 11, 22 или 33, останавливаемся: это мастер-числа. Например, 14.03.1992: 1 + 4 + 0 + 3 + 1 + 9 + 9 + 2 = 29, затем 2 + 9 = 11 — число судьбы 11." },
  { question: "Что такое мастер-числа 11, 22 и 33?", answer: "Так в нумерологии называют суммы, которые не сворачивают дальше. У каждого из них своё описание, а не описание двойки, четвёрки или шестёрки. Мастер-число не делает человека особенным — это отдельная тема для размышления." },
  { question: "Почему другой калькулятор показал другое число?", answer: "Методики расходятся: одни складывают все цифры даты сразу, другие сначала сворачивают день, месяц и год по отдельности, третьи не сохраняют мастер-числа. Мы складываем все цифры даты и сохраняем 11, 22 и 33." },
  { question: "Чем число судьбы отличается от матрицы судьбы?", answer: "Число судьбы — одно число из суммы цифр даты. Матрица судьбы строится по той же дате, но даёт целую схему из арканов: личность, центр, задачу и другие позиции. Это разные практики, их можно читать вместе." },
  { question: "Это предсказание?", answer: "Нет. Число судьбы — символическая практика для самопознания. Оно не определяет события, здоровье, доход или отношения, а предлагает тему и вопрос для размышления." },
  { question: "Куда попадает дата рождения?", answer: "Расчёт выполняется в браузере. Дата не включается в адрес страницы и в события Метрики. Только при переходе к Матрице она временно сохраняется в текущей вкладке, чтобы не вводить её повторно." },
] as const;

export const PERSONAL_YEAR_FAQ = [
  { question: "Как рассчитать личный год 2027 по дате рождения?", answer: "Сложите цифры дня и месяца рождения и цифры 2027 года: 2 + 0 + 2 + 7. Сумму сворачивайте сложением цифр до числа от 1 до 9. Например, 14 марта: 1 + 4 + 0 + 3 + 2 + 0 + 2 + 7 = 19, затем 1 + 9 = 10 и 1 + 0 = 1 — личный год 1." },
  { question: "Чем личный год отличается от аркана 2027 года?", answer: "Это разные практики. Аркан года считается от центра вашей матрицы судьбы и описывает образ календарного года через 22 аркана. Личный год — нумерологическое число от 1 до 9, оно показывает место 2027 года в вашем девятилетнем цикле. Их можно читать вместе." },
  { question: "Почему год рождения не участвует в расчёте?", answer: "Личный год описывает, какой по счёту год девятилетнего цикла начинается для вас в 2027 году. Для этого нужны день и месяц рождения и сам 2027 год. Поэтому у людей с одинаковой датой рождения, но разными годами, личный год совпадает." },
  { question: "Когда начинается личный год — 1 января или в день рождения?", answer: "Мы считаем личный год по календарю: с 1 января по 31 декабря 2027 года. В некоторых школах его отсчитывают от дня рождения; это другой вариант методики." },
  { question: "Это прогноз на 2027 год?", answer: "Нет. Личный год — символическая тема для размышления. Он не определяет события, доход, здоровье или отношения, а подсказывает, на чём можно сосредоточиться." },
] as const;

export const CLOCK_FAQ = [
  { question: "Что значит одинаковое время на часах?", answer: "Одинаковым называют время, где часы равны минутам: 11:11, 15:15, 20:20. В нумерологии его читают как повтор одного числа, который усиливает его тему. Это символ для размышления, а не знак и не прогноз." },
  { question: "Что такое зеркальное время?", answer: "Зеркальным называют время, где минуты — это часы, прочитанные справа налево: 12:21, 05:50, 23:32. Его читают через тему отражения и взгляда со стороны. У часов с 06 по 09 и с 16 по 19 зеркального времени нет: минут 60–91 не бывает." },
  { question: "Почему 00:00, 11:11 и 22:22 стоят в обеих группах?", answer: "У них часы равны минутам, и запись читается одинаково с обеих сторон. Поэтому это время одновременно одинаковое и зеркальное." },
  { question: "Как считается значение времени?", answer: "Смотрим на числа часов и минут и складываем все цифры времени, сворачивая сумму до 1–9. Например, 12:21: 1 + 2 + 2 + 1 = 6. Числа часов и минут дают тему, сумма — то, к чему она ведёт." },
  { question: "Почему я часто вижу одинаковое время?", answer: "Внимание запоминает красивые сочетания цифр и пропускает обычные. Если вы регулярно смотрите на часы в одно и то же время, совпадения случаются часто. Символическое прочтение можно оставить как повод для паузы, но время на часах ничего не предсказывает." },
] as const;
