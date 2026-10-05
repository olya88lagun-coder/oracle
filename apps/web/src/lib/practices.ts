import { MATRIX_PATH } from "./arcana-paths";
import { COMPAT_PATH } from "./compat";
import { LILA_PATH } from "./lila-paths";
import { TARO_PATH } from "./taro-paths";

export type Practice = { slug: "matrix" | "lila" | "compat" | "tarot" | "natal"; title: string; summary: string; href: string | null };

// Порядок — порядок запуска из спецификации (раздел 6); href есть только у открытых практик
export const PRACTICES: readonly Practice[] = [
  { slug: "matrix", title: "Матрица судьбы", summary: "Символические темы по дате рождения: Личность, Центр и Задача. Начните с бесплатного расчёта и описаний трёх ключевых позиций.", href: MATRIX_PATH },
  { slug: "lila", title: "Лила", summary: "Сформулируйте один личный вопрос и исследуйте его через игру на поле из 72 клеток. На каждом шаге можно прочитать вопрос и записать мысль.", href: LILA_PATH },
  { slug: "compat", title: "Совместимость", summary: "Рассчитайте общий аркан по двум датам и прочитайте вопрос для разговора вдвоём.", href: COMPAT_PATH },
  { slug: "tarot", title: "Таро", summary: "Карта дня и значения 78 карт: образ, небольшое действие и вопрос для себя.", href: TARO_PATH },
  { slug: "natal", title: "Натальная карта", summary: "Настоящий расчёт по дате, времени и месту рождения.", href: null },
];

// Один призыв для бесплатного входа по всему сайту и одно обещание результата
export const FREE_MATRIX_CTA = "Рассчитать матрицу бесплатно";
export const FREE_RESULT_PROMISE = "Бесплатно — три ключевые позиции: Личность, Центр и Задача.";
export const FREE_RESULT_TERMS = "По дате рождения · без регистрации · около минуты";
