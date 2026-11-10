import { BODY_NAMES, natalHousePageName, natalPageName, type NatalBody } from "@oracle/content/natal";
import { acceptedHousePages, acceptedNatalPages } from "./natal-pages";
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
export const natalCatalog = (): CatalogGroup[] => groupByBody(acceptedNatalPages(), (page) => natalPageName(page.body, page.sign));

function groupByBody<P extends { slug: string; body: NatalBody }>(pages: readonly P[], text: (page: P) => string): CatalogGroup[] {
  const groups = new Map<NatalBody, CatalogGroup>();
  for (const page of pages) {
    const group = groups.get(page.body) ?? { body: page.body, title: BODY_NAMES[page.body].name, links: [] };
    group.links.push({ href: natalPagePath(page), text: text(page) });
    groups.set(page.body, group);
  }
  return [...groups.values()];
}

// Каталог «планета в доме»: те же группы по планетам, дома внутри группы — по порядку манифеста (по возрастанию)
export const HOUSES_TITLE = "Планеты в домах";
export const HOUSES_LEAD = "Дом показывает сферу жизни, в которой тема планеты может проявляться особенно заметно. Для расчёта домов нужны дата, точное время и место рождения. Выберите доступное положение:";
export const HOUSES_NOTE = "Если время рождения неизвестно, знаки планет всё равно можно посмотреть, а положения домов будут недоступны.";

export const natalHouseCatalog = (): CatalogGroup[] => groupByBody(acceptedHousePages(), (page) => natalHousePageName(page.body, page.house));
