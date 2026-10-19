import raw from "./generated/natal-keys.json";
import { ACCEPTED_BATCHES, natalPageBySlug } from "./natal-manifest";

// Краткие выдержки (начало раздела «Суть») для блоков «Что это значит» под результатом калькулятора. Только принятые партии.
// Отдельный маленький файл: калькулятор грузится в браузер, и 36 полных текстов в него не попадают.
// Ключ — «<тело>-<знак>», как у реестра калькулятора: sun-pisces, moon-cancer, ascendant-cancer. Собирается: pnpm content:build
export type NatalKeySummary = { slug: string; summary: string };

export const NATAL_KEY_SUMMARIES: Readonly<Record<string, NatalKeySummary>> = Object.fromEntries(
  Object.entries(raw as Record<string, string>).flatMap(([slug, summary]) => {
    const ref = natalPageBySlug(slug);
    return ref && ACCEPTED_BATCHES.has(ref.batch) ? [[`${ref.body}-${ref.sign}`, { slug, summary }] as const] : [];
  }),
);
