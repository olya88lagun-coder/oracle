import { CHAPTER_IDS, type ChapterId } from "@oracle/core";
import { findStopPhrases } from "./check";

export class PositionsFormatError extends Error {}

const IDS = new Set<string>(CHAPTER_IDS);

// positions.md: «## <id главы>» и под ним 2–3 предложения о том, что показывает эта часть матрицы
export function parsePositions(source: string): Record<ChapterId, string> {
  const fail = (message: string): never => {
    throw new PositionsFormatError(`positions.md: ${message}`);
  };
  const [before, ...chunks] = source.replace(/\r\n/g, "\n").trim().split(/^## /m);
  if (before?.trim()) fail("текст до первой главы");
  const found = new Map<string, string>();
  for (const chunk of chunks) {
    const newline = chunk.indexOf("\n");
    const id = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
    if (!IDS.has(id)) fail(`неизвестная глава «${id}»`);
    if (found.has(id)) fail(`глава «${id}» повторяется`);
    found.set(id, (newline === -1 ? "" : chunk.slice(newline + 1)).replace(/\s+/g, " ").trim());
  }
  for (const id of CHAPTER_IDS) {
    const text = found.get(id);
    if (!text) fail(`нет описания главы «${id}»`);
    const stops = findStopPhrases(text ?? "");
    if (stops.length > 0) fail(`глава «${id}»: запрещённые обороты — ${stops.join(", ")}`);
  }
  return Object.fromEntries(found) as Record<ChapterId, string>;
}
