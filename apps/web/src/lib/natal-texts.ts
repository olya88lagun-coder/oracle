import { NATAL_KEY_SUMMARIES } from "@oracle/content/natal-keys";
import type { BodyId, SignId } from "@oracle/core/natal";
import { natalPagePath } from "./natal-paths";

// Реестр опубликованных ключевых текстов («Солнце в Рыбах», «Луна в Раке», «Асцендент в Раке», «Северный узел в Овне»), которые калькулятор показывает под результатом.
// Ключ — «<тело>-<знак>»: sun-pisces, moon-cancer, ascendant-cancer. Берётся из выдержек принятых партий (packages/content, natal-keys):
// пока партия не принята, блок остаётся «Подробный текст скоро появится». Из @oracle/core/natal здесь только тип;
// полные тексты в браузер не попадают — только выдержки и адреса страниц.

export type NatalKeyBody = BodyId | "ascendant" | "northNode";
export type NatalKeyText = { summary: string; href: string };
export type NatalKeyRegistry = Readonly<Record<string, NatalKeyText>>;

export const NATAL_KEY_TEXTS: NatalKeyRegistry = Object.fromEntries(Object.entries(NATAL_KEY_SUMMARIES).map(([key, { slug, summary }]) => [key, { summary, href: natalPagePath({ slug }) }]));

export const natalKeyId = (body: NatalKeyBody, sign: SignId): string => `${body}-${sign}`;

// Опубликованный текст для положения или null, если его ещё нет. Реестр передаётся параметром, чтобы проверять оба случая без правки константы
export function keyTextFor(body: NatalKeyBody, sign: SignId, registry: NatalKeyRegistry = NATAL_KEY_TEXTS): NatalKeyText | null {
  const key = natalKeyId(body, sign);
  return Object.hasOwn(registry, key) ? (registry[key] ?? null) : null;
}
