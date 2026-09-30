import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const readText = (file) => readFileSync(file, "utf8").replace(/\r\n/g, "\n").trim();

// Скрипт только собирает сырые тексты; разбор и проверки — в src/arcana.ts, src/positions.ts и src/check.ts
export function collectArcana(dir) {
  const sources = {};
  for (const name of readdirSync(dir).filter((file) => file.endsWith(".md")).sort()) {
    sources[name.replace(/\.md$/, "")] = readText(join(dir, name));
  }
  return sources;
}

export function collectPositions(file) {
  return { positions: readText(file) };
}

export function collectLila(file) {
  return { cells: readText(file) };
}

export function collectCompat(file) {
  return { unions: readText(file) };
}

// Статьи блога: одна запись на файл, имя файла без .md — slug
export function collectArticles(dir) {
  const sources = {};
  for (const name of readdirSync(dir).filter((file) => file.endsWith(".md")).sort()) {
    sources[name.replace(/\.md$/, "")] = readText(join(dir, name));
  }
  return sources;
}

function write(output, data) {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`written: ${output}`);
}

if (import.meta.main) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  write(join(root, "src", "generated", "arcana.json"), collectArcana(join(root, "arcana")));
  write(join(root, "src", "generated", "positions.json"), collectPositions(join(root, "positions.md")));
  write(join(root, "src", "generated", "lila.json"), collectLila(join(root, "lila-cells.md")));
  write(join(root, "src", "generated", "compat.json"), collectCompat(join(root, "compat-arcana.md")));
  write(join(root, "src", "generated", "tarot.json"), collectArcana(join(root, "tarot")));
  write(join(root, "src", "generated", "articles.json"), collectArticles(join(root, "articles")));
}
