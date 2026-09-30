import raw from "./generated/compat.json";
import { parseCompatUnions, type CompatUnion } from "./compat";

export type { CompatUnion } from "./compat";

// Собранные тексты: pnpm content:build → src/generated/compat.json. Отдельная точка входа, как у Лилы
export const COMPAT_UNIONS: readonly CompatUnion[] = parseCompatUnions(raw.unions);

export function compatUnionByNumber(number: number): CompatUnion {
  const union = COMPAT_UNIONS.find((item) => item.number === number);
  if (!union) throw new Error(`Союз ${number} не найден — выполните pnpm content:build`);
  return union;
}
