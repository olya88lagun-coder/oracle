import type { Goal } from "./analytics";
import { MATRIX_PATH } from "./arcana-paths";
import { FREE_MATRIX_CTA, FREE_RESULT_PROMISE, FREE_RESULT_TERMS } from "./practices";

// Мягкий мост со страниц Таро к матрице: образ на один вопрос — и личная схема по дате рождения. Без цен и давления:
// вход в матрицу бесплатный, тот же призыв и то же обещание, что на главной и в других местах сайта
export const TARO_BRIDGE = {
  title: "От карты к своей схеме",
  text: {
    card: "Таро даёт образ на один вопрос, а матрица судьбы показывает ваши личные точки по дате рождения: Личность, Центр и Задачу. Это тоже символический язык для размышления, а не прогноз.",
    day: "Карта дня — образ на один день. Если хочется более устойчивой картины, посмотрите матрицу судьбы: три ключевые позиции по дате рождения. Это символический язык для размышления, а не прогноз.",
  },
  href: MATRIX_PATH,
  cta: FREE_MATRIX_CTA,
  promise: FREE_RESULT_PROMISE,
  terms: FREE_RESULT_TERMS,
} as const;

// Цель, которой уже считаются переходы из таро в другие практики (docs/analytics-goals.md)
export const TARO_BRIDGE_CTA_GOAL: Goal = "taro_to_practice";
