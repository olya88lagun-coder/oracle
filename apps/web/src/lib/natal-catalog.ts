import { BODY_NAMES, natalPageName, type NatalBody } from "@oracle/content/natal";
import { acceptedNatalPages } from "./natal-pages";
import { NATAL_PATH, natalPagePath } from "./natal-paths";

// Каталог страниц значений на главной странице практики. Без него адреса «Солнце в Овне» и подобные не достижимы кликом:
// ссылки на них есть только в таблице результата после расчёта, а поисковый робот расчёт не запускает
export const CATALOG_TITLE = "Значения планет в знаках";
export const CATALOG_LEAD = "Выберите планету, асцендент или Северный узел, а затем знак: на странице значения — как это положение может проявляться и о чём стоит себя спросить.";
export const PRIMER_LEAD = "Как выглядит полный разбор карты:";
export const PRIMER_LINK = { href: `${NATAL_PATH}/primer`, text: "Пример разбора натальной карты" } as const;

export type CatalogLink = { href: string; text: string };
export type CatalogGroup = { body: NatalBody; title: string; links: CatalogLink[] };

// Группы идут в порядке манифеста (Солнце, Луна, асцендент, планеты, узел), знаки внутри группы — по зодиаку
export function natalCatalog(): CatalogGroup[] {
  const groups = new Map<NatalBody, CatalogGroup>();
  for (const page of acceptedNatalPages()) {
    const group = groups.get(page.body) ?? { body: page.body, title: BODY_NAMES[page.body].name, links: [] };
    group.links.push({ href: natalPagePath(page), text: natalPageName(page.body, page.sign) });
    groups.set(page.body, group);
  }
  return [...groups.values()];
}
