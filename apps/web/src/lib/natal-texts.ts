import type { SignId } from "@oracle/core/natal";

// Реестр опубликованных ключевых текстов («Солнце в Рыбах», «Луна в Раке», «Асцендент в Раке»), которые калькулятор показывает под результатом.
// Ключ — «<тело>-<знак>»: sun-pisces, moon-cancer, ascendant-cancer. Пока реестр пуст, каждый блок «Что это значит» — «скоро появится»;
// тексты и адреса страниц значений добавят задачи 6 и 8 плана 7. Из @oracle/core/natal здесь только тип.

export type NatalKeyBody = "sun" | "moon" | "ascendant";
export type NatalKeyText = { summary: string; href: string };
export type NatalKeyRegistry = Readonly<Record<string, NatalKeyText>>;

export const NATAL_KEY_TEXTS: NatalKeyRegistry = {};

export const natalKeyId = (body: NatalKeyBody, sign: SignId): string => `${body}-${sign}`;

// Опубликованный текст для положения или null, если его ещё нет. Реестр передаётся параметром, чтобы проверять оба случая без правки константы
export function keyTextFor(body: NatalKeyBody, sign: SignId, registry: NatalKeyRegistry = NATAL_KEY_TEXTS): NatalKeyText | null {
  const key = natalKeyId(body, sign);
  return Object.hasOwn(registry, key) ? (registry[key] ?? null) : null;
}
