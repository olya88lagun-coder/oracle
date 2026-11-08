import { MATRIX_PATH } from "./arcana-paths";
import { COMPAT_PATH } from "./compat";
import { LILA_PATH } from "./lila-paths";
import { NATAL_PATH } from "./natal-paths";
import { NUMEROLOGY_PATH } from "./numerology";
import { TARO_PATH } from "./taro-paths";

export type Practice = { slug: "matrix" | "lila" | "compat" | "tarot" | "natal" | "numerology"; title: string; summary: string; href: string | null };

// Порядок — порядок запуска из спецификации (раздел 6); href есть только у открытых практик
export const PRACTICES: readonly Practice[] = [
  { slug: "matrix", title: "Матрица судьбы", summary: "Символические темы по дате рождения: Личность, Центр и Задача. Начните с бесплатного расчёта и описаний трёх ключевых позиций.", href: MATRIX_PATH },
  { slug: "lila", title: "Лила", summary: "Сформулируйте один личный вопрос и исследуйте его через игру на поле из 72 клеток. На каждом шаге можно прочитать вопрос и записать мысль.", href: LILA_PATH },
  { slug: "compat", title: "Совместимость", summary: "Рассчитайте общий аркан по двум датам и прочитайте вопрос для разговора вдвоём.", href: COMPAT_PATH },
  { slug: "tarot", title: "Таро", summary: "Карта дня и значения 78 карт: образ, небольшое действие и вопрос для себя.", href: TARO_PATH },
  { slug: "natal", title: "Натальная карта", summary: "Положения Солнца, Луны и планет, асцендент, дома и аспекты по дате, времени и месту рождения. Считается в вашем браузере.", href: NATAL_PATH },
  { slug: "numerology", title: "Нумерология", summary: "Число судьбы и личный год 2027 по дате рождения: расчёт с объяснением и описание каждого числа.", href: NUMEROLOGY_PATH },
];

// Один призыв для бесплатного входа по всему сайту и одно обещание результата
export const FREE_MATRIX_CTA = "Рассчитать матрицу бесплатно";
export const FREE_RESULT_PROMISE = "Бесплатно — три ключевые позиции: Личность, Центр и Задача.";
export const FREE_RESULT_TERMS = "По дате рождения · без регистрации · около минуты";
