import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { WEEKDAY_PLANETS } from "./weekday-planets";

// Цвета планет живут в globals.css как переменные: тест читает их оттуда и проверяет, что каждый читается на тёмной карточке
const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
const hex = (name: string): string => new RegExp(name + ": *(#[0-9a-fA-F]{6})").exec(css)?.[1] ?? "";

const channel = (value: number): number => {
  const unit = value / 255;
  return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
};
const luminance = (color: string): number => {
  const [r, g, b] = [1, 3, 5].map((index) => channel(Number.parseInt(color.slice(index, index + 2), 16)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
};

test("every planet has a colour token and a data-planet rule that sets --planet", () => {
  for (const { glyph } of WEEKDAY_PLANETS) {
    expect(hex(`--planet-${glyph}`), glyph).not.toBe("");
    expect(css, glyph).toContain(`[data-planet="${glyph}"] { --planet: var(--planet-${glyph}); }`);
  }
  expect(css.match(/--planet-[a-z]+:\s*#/g)).toHaveLength(WEEKDAY_PLANETS.length);
});

test("every planet colour reads on the dark card surface (WCAG AA, 4.5:1)", () => {
  const surface = hex("--surface");
  expect(surface).not.toBe("");
  for (const { glyph } of WEEKDAY_PLANETS) expect(contrast(hex(`--planet-${glyph}`), surface), glyph).toBeGreaterThanOrEqual(4.5);
});
