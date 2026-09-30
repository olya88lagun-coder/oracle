import { MATRIX_PATH } from "./arcana-paths";
import { BLOG_PATH } from "./blog";
import { COMPAT_PATH } from "./compat";
import { LILA_PATH } from "./lila-paths";
import { TARO_PATH } from "./taro-paths";

// Разделы сайта для шапки и подвала: короткая подпись для полосы навигации и полное название для меню на телефоне
export const SECTIONS: readonly { href: string; short: string; title: string }[] = [
  { href: MATRIX_PATH, short: "Матрица", title: "Матрица судьбы" },
  { href: COMPAT_PATH, short: "Совместимость", title: "Совместимость" },
  { href: LILA_PATH, short: "Лила", title: "Лила" },
  { href: TARO_PATH, short: "Таро", title: "Таро" },
  { href: BLOG_PATH, short: "Блог", title: "Блог" },
];
