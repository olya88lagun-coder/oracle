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

// Функции планет для натального разбора: один файл целиком, разбор — в src/natal-houses.ts
export function collectNatalPlanets(file) {
  return { planets: readText(file) };
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

// Краткие выдержки для калькулятора: первый абзац раздела «Суть», укороченный до границы предложения.
// Калькулятору нужны только они, а не 36 полных текстов, поэтому они лежат в отдельном маленьком файле
const SUMMARY_MAX = 180;
const SUMMARY_MIN = 80;

export function natalSummary(source) {
  const text = source.replace(/\r\n/g, "\n");
  const match = /^## Суть\n+([\s\S]*?)(?:\n\n|\n## )/m.exec(text);
  const paragraph = (match?.[1] ?? "").replace(/\s+/g, " ").trim();
  if (paragraph.length <= SUMMARY_MAX) return paragraph;
  const head = paragraph.slice(0, SUMMARY_MAX + 1);
  const sentenceEnd = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  if (sentenceEnd >= SUMMARY_MIN) return head.slice(0, sentenceEnd + 1);
  return `${head.slice(0, head.lastIndexOf(" ")).replace(/[,;:\s—-]+$/, "")}…`;
}

export function collectNatalKeys(dir) {
  const summaries = {};
  for (const name of readdirSync(dir).filter((file) => file.endsWith(".md")).sort()) {
    const text = readText(join(dir, name));
    const slug = /^slug:\s*(\S+)/m.exec(text)?.[1];
    if (slug) summaries[slug] = natalSummary(text);
  }
  return summaries;
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
  write(join(root, "src", "generated", "natal.json"), collectArcana(join(root, "natal")));
  write(join(root, "src", "generated", "natal-keys.json"), collectNatalKeys(join(root, "natal")));
  write(join(root, "src", "generated", "natal-houses.json"), collectArcana(join(root, "natal-houses")));
  write(join(root, "src", "generated", "natal-planets.json"), collectNatalPlanets(join(root, "natal-planets.md")));
  write(join(root, "src", "generated", "articles.json"), collectArticles(join(root, "articles")));
}
