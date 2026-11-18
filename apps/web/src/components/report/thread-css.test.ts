import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const css = readFileSync(new URL("../../app/numerologiya/grafik-sudby/thread.css", import.meta.url), "utf8");

// Цвета нити заведены переменными; на странице разбора нет .thread-page, поэтому селектор должен включать и .thread-report
test("thread colour variables are defined for both the thread page and the report page", () => {
  const selector = /([^{}]+)\{[^{}]*--thread-glint\s*:[^{}]*--thread-lavender-soft\s*:/.exec(css)?.[1] ?? "";
  expect(selector).toContain(".thread-page");
  expect(selector).toContain(".thread-report");
});
