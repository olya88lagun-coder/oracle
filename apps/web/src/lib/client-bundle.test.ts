import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

// Модули, которые импортируют клиентские компоненты: в них нет @oracle/content/numerology, иначе все тексты нумерологии
// (и непринятые партии) попадают в браузерный чанк. Принятые адреса — в numerology-pages.ts, только для сервера
test.each(["numerology.ts", "pythagoras.ts", "pythagoras-compat.ts"])("lib/%s does not pull numerology texts into the browser", (file) => {
  expect(readFileSync(new URL(`./${file}`, import.meta.url), "utf8")).not.toMatch(/@oracle\/content\/numerology["']/);
});
