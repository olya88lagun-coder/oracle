import { GLOSSARY_PATH, GLOSSARY_TITLE } from "./natal-glossary";
import { QUICK_PAGES } from "./natal-quick-pages";

// Ссылки с главной страницы калькулятора на быстрые расчёты и словарь: без них эти страницы доступны только из карты сайта и из текстов
export const MORE_LINKS_TITLE = "Быстрые расчёты и словарь";

export type MoreLink = { href: string; title: string; text: string };

export const MORE_LINKS: readonly MoreLink[] = [
  { href: QUICK_PAGES.ascendant.path, title: QUICK_PAGES.ascendant.breadcrumb, text: "Знак, который поднимался над восточным горизонтом в момент рождения. Нужно время рождения." },
  { href: QUICK_PAGES.moon.path, title: QUICK_PAGES.moon.breadcrumb, text: "В каком знаке стояла Луна. Хватит одной даты; время уточняет знак в день, когда Луна его меняла." },
  { href: GLOSSARY_PATH, title: GLOSSARY_TITLE, text: "Асцендент, дом, аспект, орбис и другие слова из результата простым языком." },
];
