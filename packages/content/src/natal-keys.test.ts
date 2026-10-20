import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { collectNatalKeys, natalSummary } from "../scripts/build-arcana.mjs";
import raw from "./generated/natal-keys.json";
import { NATAL_KEY_SUMMARIES } from "./natal-keys";
import { ACCEPTED_BATCHES, NATAL_PAGES, natalText } from "./natal-texts";

describe("natal key summaries", () => {
  test("the committed natal-keys.json matches the markdown files — run pnpm content:build after editing texts", () => {
    expect(raw).toEqual(collectNatalKeys(fileURLToPath(new URL("../natal", import.meta.url))));
  });

  test("there is one short summary for each position of an accepted batch, and none for a closed one", () => {
    const keys = Object.keys(NATAL_KEY_SUMMARIES);
    const accepted = NATAL_PAGES.filter((page) => ACCEPTED_BATCHES.has(page.batch));
    expect(keys).toHaveLength(accepted.length);
    for (const page of accepted) expect(keys, page.slug).toContain(`${page.body}-${page.sign}`);
    for (const { slug, summary } of Object.values(NATAL_KEY_SUMMARIES)) {
      expect(summary.length, slug).toBeGreaterThanOrEqual(60);
      // 180 знаков и, если абзац обрезан по слову, многоточие (как в natalSummary)
      expect(summary.length, slug).toBeLessThanOrEqual(181);
      // Выдержка — начало «Сути» своей страницы
      const essence = natalText(slug)?.essence[0] ?? "";
      expect(essence.startsWith(summary.replace(/…$/, "")), slug).toBe(true);
    }
  });
});

describe("natalSummary", () => {
  test("keeps a short first paragraph whole and cuts a long one at a sentence end", () => {
    expect(natalSummary("## Суть\n\nКороткий абзац.\n\nВторой.")).toBe("Короткий абзац.");
    const long = `${"Слово ".repeat(14)}закончено. ${"Дальше ".repeat(40)}конец.`;
    const result = natalSummary(`## Суть\n\n${long}\n\n## Другое`);
    expect(result.endsWith("закончено.")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(180);
  });

  test("without a sentence end it cuts at a word and adds an ellipsis", () => {
    const result = natalSummary(`## Суть\n\n${"слово ".repeat(60)}\n\nДалее.`);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(181);
  });
});
