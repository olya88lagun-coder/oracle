import { readdirSync } from "node:fs";
import path from "node:path";

// Файлы иллюстраций клеток, которые уже лежат в public/lila. Читается на сервере при показе страницы, не в браузере
export function availableCellImages(): string[] {
  try {
    return readdirSync(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "lila")).filter((name) => name.endsWith(".webp"));
  } catch {
    return [];
  }
}
