// Поиск по 72 клеткам Лилы на странице /lila: по номеру, названию и описанию («О чём это»). Идёт в браузере, запрос никуда не уходит
export type CellSearchItem = { readonly number: number; readonly name: string; readonly text: string };

// Нижний регистр и «е» вместо «ё»: «зависть», «Зависть» и «ЗАВИСТЬ» ищутся одинаково
const normalize = (value: string): string => value.toLowerCase().replaceAll("ё", "е").trim();

// Все слова запроса должны найтись (И); число — это номер клетки (точное совпадение), остальное — подстрока названия или описания
export function matchesCell(item: CellSearchItem, query: string): boolean {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = normalize(`${item.name} ${item.text}`);
  return tokens.every((token) => (/^\d+$/.test(token) ? Number(token) === item.number : haystack.includes(token)));
}

export const filterCells = <T extends CellSearchItem>(items: readonly T[], query: string): T[] => items.filter((item) => matchesCell(item, query));
