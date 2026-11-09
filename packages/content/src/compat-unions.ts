import raw from "./generated/compat.json";
import { parseCompatUnions, type CompatUnion } from "./compat";
import { parseCompatSpheres, type CompatSpheres } from "./compat-spheres";

export type { CompatUnion } from "./compat";

// Собранные тексты: pnpm content:build → src/generated/compat.json. Отдельная точка входа, как у Лилы
export const COMPAT_UNIONS: readonly CompatUnion[] = parseCompatUnions(raw.unions);

export function compatUnionByNumber(number: number): CompatUnion {
  const union = COMPAT_UNIONS.find((item) => item.number === number);
  if (!union) throw new Error(`Союз ${number} не найден — выполните pnpm content:build`);
  return union;
}

export type { CompatSpheres } from "./compat-spheres";

// Сферы союза (compat-spheres.md) вычитывает владелица. Пока партия не принята, на сайте их нет.
// Принятие — отдельным коммитом: true и дата.
export const COMPAT_SPHERES_ACCEPTED = false;

export const COMPAT_SPHERES: readonly CompatSpheres[] = parseCompatSpheres(raw.spheres);

export function compatSpheresByNumber(number: number): CompatSpheres | undefined {
  return COMPAT_SPHERES_ACCEPTED ? COMPAT_SPHERES.find((item) => item.number === number) : undefined;
}
