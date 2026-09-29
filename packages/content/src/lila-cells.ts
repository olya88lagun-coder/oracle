import raw from "./generated/lila.json";
import { parseLilaCells, type LilaCell } from "./lila";

export type { LilaCell } from "./lila";

// Собранные тексты: pnpm content:build → src/generated/lila.json. Отдельная точка входа, чтобы клиентский бандл не тянул арканы
export const LILA_CELLS: readonly LilaCell[] = parseLilaCells(raw.cells);

export function lilaCellByNumber(number: number): LilaCell {
  const cell = LILA_CELLS.find((item) => item.number === number);
  if (!cell) throw new Error(`Клетка ${number} не найдена — выполните pnpm content:build`);
  return cell;
}

export function lilaCellBySlug(slug: string): LilaCell | undefined {
  return LILA_CELLS.find((item) => item.slug === slug);
}
