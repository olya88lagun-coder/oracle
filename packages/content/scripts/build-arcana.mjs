import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Скрипт только собирает сырые тексты; разбор и проверки — в src/arcana.ts и src/check.ts
export function collectArcana(dir) {
  const sources = {};
  for (const name of readdirSync(dir).filter((file) => file.endsWith(".md")).sort()) {
    sources[name.replace(/\.md$/, "")] = readFileSync(join(dir, name), "utf8").replace(/\r\n/g, "\n").trim();
  }
  return sources;
}

if (import.meta.main) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const output = join(root, "src", "generated", "arcana.json");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(collectArcana(join(root, "arcana")), null, 2)}\n`, "utf8");
  console.log(`arcana.json written: ${output}`);
}
