import { calculateLifeThread, type LifeThread } from "@oracle/core";
import { DATE_ERROR } from "./matrix-save";
import { NUMEROLOGY_PATH } from "./numerology";

// «Нить» — график судьбы по дате рождения (docs/superpowers/specs/2026-11-18-life-thread-design.md)
export const THREAD_PATH = `${NUMEROLOGY_PATH}/grafik-sudby`;

// Календарный день посетителя как «сегодня» в UTC: утром в день рождения год уже новый, в каком бы часовом поясе человек ни был
export const localToday = (now: Date): Date => new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

export type ThreadOutcome = { ok: true; iso: string; thread: LifeThread } | { ok: false; error: string };

export function threadOutcome(iso: string, today: Date): ThreadOutcome {
  const thread = calculateLifeThread(iso, today);
  return thread ? { ok: true, iso, thread } : { ok: false, error: DATE_ERROR };
}

// Названия положений четырёх периодов; тексты периодов привязаны только к числу, положение подписывается здесь
export const PERIOD_POSITIONS: Readonly<Record<1 | 2 | 3 | 4, string>> = { 1: "формирование", 2: "зрелость", 3: "плоды", 4: "мудрость" };

// Текст карточки, переданный с сервера: клиентские компоненты не импортируют @oracle/content/numerology
export type ThreadCard = { readonly sections: readonly { readonly title: string; readonly paragraphs: readonly string[] }[] };
export type ThreadTexts = { readonly years: Readonly<Record<number, ThreadCard>>; readonly periods: Readonly<Record<number, ThreadCard>> };

export const THREAD_FAQ = [
  { question: "Как строится нить по дате рождения?", answer: "Для каждого года жизни считаем личный год: цифры дня и месяца рождения плюс цифры самого года, сумму сворачиваем до числа от 1 до 9. Годы идут девятилетним циклом: старт, терпение, самовыражение, фундамент, перемены, забота, осмысление, урожай, завершение. Высота линии показывает характер этапа, а не оценку: восьмёрка — год урожая, двойка — тихая внутренняя работа." },
  { question: "Чем нить отличается от личного года 2027 и матрицы судьбы?", answer: "Личный год 2027 — одно число для календарного года. Нить показывает все годы жизни и считает год от дня рождения до следующего. Матрица судьбы строится по другой схеме, через 22 аркана, а не через цикл чисел. Эти практики можно читать вместе." },
  { question: "Почему год считается от дня рождения, а не с 1 января?", answer: "Мы отсчитываем личный год от дня рождения до следующего. В некоторых школах его считают по календарю, с 1 января; это другой вариант методики, и тогда результат может отличаться." },
  { question: "Что значит «тихий» год на линии?", answer: "Тихий год не плохой и не потерянный. В такие годы работа идёт внутри: учёба, восстановление, подготовка. Без них не бывает лет, когда результат заметен." },
  { question: "Это предсказание?", answer: "Нет. Нить — символическая практика для самопознания. Она не говорит, что произойдёт, и не заменяет консультацию специалиста. Её можно использовать как повод посмотреть на свою жизнь целиком и задать себе вопросы." },
  { question: "Куда попадает дата рождения?", answer: "Расчёт выполняется в браузере. Дата не включается в адрес страницы, в события Метрики и не отправляется на сервер." },
] as const;

// Плашка на главной: тон как у страницы, символ для размышления, не прогноз
export const THREAD_PROMO = {
  eyebrow: "Новое",
  title: "График судьбы: вся жизнь одной нитью",
  text: "Бесплатно по дате рождения: личные годы, четыре периода жизни и точка «вы здесь». Это не прогноз, а ритм, который можно спокойно рассмотреть.",
  cta: "Показать мою нить",
} as const;
