import { MATRIX_PATH } from "./arcana-paths";
import { BLOG_PATH } from "./blog";
import { COMPAT_PATH } from "./compat";
import { LILA_PATH } from "./lila-paths";
import { isMoonPath } from "./moon-nav";
import { MOON_PATH } from "./moon-paths";
import { NATAL_PATH } from "./natal-paths";
import { NUMEROLOGY_PATH } from "./numerology";
import { TARO_PATH } from "./taro-paths";

export type Section = { readonly href: string; readonly short: string; readonly title: string };

// Разделы сайта для шапки и подвала: короткая подпись для полосы навигации и полное название для меню на телефоне
export const SECTIONS: readonly Section[] = [
  { href: MATRIX_PATH, short: "Матрица", title: "Матрица судьбы" },
  { href: COMPAT_PATH, short: "Совместимость", title: "Совместимость" },
  { href: LILA_PATH, short: "Лила", title: "Лила" },
  { href: TARO_PATH, short: "Таро", title: "Таро" },
  { href: NATAL_PATH, short: "Натальная карта", title: "Натальная карта" },
  { href: MOON_PATH, short: "Луна", title: "Луна" },
  { href: NUMEROLOGY_PATH, short: "Нумерология", title: "Нумерология" },
  { href: BLOG_PATH, short: "Блог", title: "Блог" },
];

// Десктоп: пять главных практик в полосе (Луна остаётся видимой после натальной), остальное — в «Ещё»
const PRIMARY_HREFS = new Set([MATRIX_PATH, LILA_PATH, TARO_PATH, NATAL_PATH, MOON_PATH]);

export const NAV_PRIMARY: readonly Section[] = SECTIONS.filter((section) => PRIMARY_HREFS.has(section.href));
export const NAV_MORE: readonly Section[] = SECTIONS.filter((section) => !PRIMARY_HREFS.has(section.href));

// Пункт «Луна» подсвечен на всех лунных страницах, остальные — по префиксу своего адреса
export const isSectionCurrent = (pathname: string, section: { href: string }): boolean =>
  section.href === MOON_PATH ? isMoonPath(pathname) : pathname === section.href || pathname.startsWith(`${section.href}/`);
