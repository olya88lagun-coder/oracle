import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

// Фразы, которые уже были исправлены после аудита 22 ноября 2026 и не должны вернуться: каждая спорила с тем, что сайт делает на самом деле.
// Новая запись — когда исправляешь обещание, которое разошлось с продуктом: pattern — что искать, why — что теперь верно, only — в каких путях (по умолчанию везде).
type Stale = { pattern: RegExp; why: string; only?: RegExp };

const STALE: readonly Stale[] = [
  { pattern: /практики открываются по очереди/i, why: "все практики открыты" },
  { pattern: /ближайш\p{L}+ крупн\p{L}+ город/iu, why: "подсказка про город — приближение, ближайший к месту рождения, а не «крупный»" },
  { pattern: /(?:онлайн-расклад\p{L}*|расклад\p{L}*) на три карты нет/iu, why: "расклад на три карты есть: /taro/rasklady/tri-karty" },
  { pattern: /которая откроется на сайте|практик\p{L}*, которые откроются/iu, why: "практики уже открыты" },
  { pattern: /Главная точка карты/, why: "блок называется «Самое заметное в данных карты»" },
  { pattern: /Главная тема года/, why: "в раскладе на Новый год — «Главная тема уходящего года»" },
  { pattern: /Число судьбы — одна цифра|Одна цифра из вашей даты/, why: "число судьбы бывает и мастер-числом 11, 22, 33" },
  { pattern: /\bJSON\b|тайм-?аут/i, why: "в статьях для читателей нет технических деталей работы модели", only: /^(?:packages\/content\/articles\/|apps\/web\/src\/components\/blog\/)/ },
];

const ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const SCANNED = ["apps/web/src", "packages/content/articles", "packages/content/numerology", "packages/content/src", "e2e"];
const SKIPPED_DIR = new Set(["node_modules", ".next", "generated"]);
const SOURCE_FILE = /\.(?:ts|tsx|md)$/;
const TEST_FILE = /\.test\.(?:ts|tsx)$|test-support\.ts$/;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return SKIPPED_DIR.has(entry.name) ? [] : files(join(dir, entry.name));
    return SOURCE_FILE.test(entry.name) && !TEST_FILE.test(entry.name) ? [join(dir, entry.name)] : [];
  });
}

const FILES = SCANNED.flatMap((dir) => files(join(ROOT, dir))).map((path) => ({ path: relative(ROOT, path).replaceAll("\\", "/"), text: readFileSync(path, "utf8") }));

describe("stale phrases", () => {
  test("the scan really reads the site sources", () => {
    expect(FILES.length).toBeGreaterThan(200);
    expect(FILES.some((file) => file.path.startsWith("packages/content/articles/"))).toBe(true);
  });

  test.each(STALE.map((entry) => [String(entry.pattern), entry] as const))("%s is gone", (_name, entry) => {
    const hits = FILES.filter((file) => (entry.only ? entry.only.test(file.path) : true) && entry.pattern.test(file.text)).map((file) => file.path);
    expect(hits, entry.why).toEqual([]);
  });
});
