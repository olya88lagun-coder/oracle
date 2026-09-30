import { MATRIX_PATH } from "./arcana-paths";
import { COMPAT_PATH } from "./compat";
import { LILA_PATH } from "./lila-paths";

export type Practice = { slug: "matrix" | "lila" | "compat" | "tarot" | "natal"; title: string; summary: string; href: string | null };

// Порядок — порядок запуска из спецификации (раздел 6); href есть только у открытых практик
export const PRACTICES: readonly Practice[] = [
  { slug: "matrix", title: "Матрица судьбы", summary: "22 аркана по дате рождения: сильные стороны, повторяющиеся сценарии и точки роста.", href: MATRIX_PATH },
  { slug: "lila", title: "Лила", summary: "Игра с намерением на поле из 72 клеток — повод посмотреть на свой вопрос по-новому.", href: LILA_PATH },
  { slug: "compat", title: "Совместимость", summary: "Две даты рождения — один общий аркан: как ваши матрицы разговаривают друг с другом.", href: COMPAT_PATH },
  { slug: "tarot", title: "Таро", summary: "Расклад на вопрос и карта дня: символы как зеркало, а не приговор.", href: null },
  { slug: "natal", title: "Натальная карта", summary: "Настоящий расчёт по дате, времени и месту рождения.", href: null },
];

// Один призыв для бесплатного входа по всему сайту и одно обещание результата
export const FREE_MATRIX_CTA = "Рассчитать матрицу бесплатно";
export const FREE_RESULT_PROMISE = "Бесплатно — три ключевые позиции: Личность, Центр и Задача.";
export const FREE_RESULT_TERMS = "По дате рождения · без регистрации · около минуты";
