import raw from "./generated/year.json";
import { parseYearTexts, type YearText } from "./year";

export type { YearText } from "./year";

// Собранные тексты: pnpm content:build → src/generated/year.json. Отдельная точка входа, как у совместимости
export const YEAR_TEXTS: readonly YearText[] = parseYearTexts(raw.texts);

export function yearTextByNumber(number: number): YearText {
  const text = YEAR_TEXTS.find((item) => item.number === number);
  if (!text) throw new Error(`Аркан года ${number} не найден — выполните pnpm content:build`);
  return text;
}
