import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { NatalWheel } from "./NatalWheel";
import { SAMPLE_BIRTH, readMockup, realChart, sampleChart } from "./sample-chart.test-support";

// Колесо на сайте должно повторять принятые natal-wheel.svg и natal-wheel-no-time.svg: те же элементы в том же порядке, те же классы
// и data-атрибуты, числа с допуском 0,01. Не сверяется только то, что в компоненте сделано иначе намеренно:
// <style>, встроенный шрифт и <defs> с глифами (стили и спрайт на сайте общие), xmlns и слово «образца» в подписи.

type SvgElement = { tag: string; attrs: Record<string, string>; text: string };

const TOLERANCE = 0.01;
const IGNORED_ATTRIBUTES = new Set(["xmlns", "class"]);

// Мелкий разборщик SVG без DOM: элементы в порядке документа, тексты у text и title; без комментариев, <defs> и <style>
function parseSvg(source: string): SvgElement[] {
  const body = source.replace(/<!--[\s\S]*?-->/g, "").replace(/<defs>[\s\S]*?<\/defs>/g, "").replace(/<style>[\s\S]*?<\/style>/g, "");
  const elements: SvgElement[] = [];
  for (const match of body.matchAll(/<(text|title)\b([^>]*)>([^<]*)<\/\1>|<([a-zA-Z]+)\b([^>]*?)\/?>/g)) {
    const tag = match[1] ?? (match[4] as string);
    const rawAttributes = match[1] ? (match[2] as string) : (match[5] as string);
    const attrs: Record<string, string> = {};
    for (const attribute of rawAttributes.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[attribute[1] as string] = attribute[2] as string;
    elements.push({ tag, attrs, text: (match[3] ?? "").trim() });
  }
  return elements;
}

const classes = (element: SvgElement): string => (element.attrs.class ?? "").split(/\s+/).filter(Boolean).sort().join(" ");
const NUMBER = /-?\d*\.?\d+/g;
const isNumeric = (value: string) => value.trim() !== "" && Number.isFinite(Number(value));

// Расхождение двух значений атрибута: числа — с допуском, строки с числами (d, transform) — по числам и по «скелету» без чисел
function attributeProblem(name: string, actual: string, expected: string): string | null {
  if (isNumeric(actual) && isNumeric(expected)) return Math.abs(Number(actual) - Number(expected)) <= TOLERANCE ? null : `${name}: ${actual} вместо ${expected}`;
  if (name === "d" || name === "transform") {
    const actualNumbers = actual.match(NUMBER) ?? [];
    const expectedNumbers = expected.match(NUMBER) ?? [];
    if (actual.replace(NUMBER, "#") !== expected.replace(NUMBER, "#")) return `${name}: ${actual} вместо ${expected}`;
    // Поворот подписи равен по модулю 360: у рисунка 373.14 там, где модель даёт 13.14
    const sameTurn = (index: number) => name === "transform" && actual.includes("rotate(") && index === actualNumbers.length - 1 && Math.abs((((Number(actualNumbers[index]) - Number(expectedNumbers[index])) % 360) + 540) % 360 - 180) <= TOLERANCE;
    const off = actualNumbers.findIndex((value, index) => Math.abs(Number(value) - Number(expectedNumbers[index])) > TOLERANCE && !sameTurn(index));
    return off === -1 ? null : `${name}: число ${actualNumbers[off]} вместо ${expectedNumbers[off]}`;
  }
  return actual === expected ? null : `${name}: «${actual}» вместо «${expected}»`;
}

// Слово «образца» остаётся только в подписях принятых рисунков-образцов
const withoutSampleWording = (text: string) => text.replace("Данные образца", "Данные рождения").replace("планеты образца", "планеты");

function compareToAccepted(actualSvg: string, acceptedSvg: string): string[] {
  const actual = parseSvg(actualSvg);
  const accepted = parseSvg(acceptedSvg);
  const problems: string[] = [];
  if (actual.length !== accepted.length) problems.push(`элементов ${actual.length}, в рисунке ${accepted.length}`);
  accepted.forEach((expected, index) => {
    const got = actual[index];
    const where = `#${index} <${expected.tag} ${expected.attrs.class ?? ""}>`;
    if (!got) return;
    if (got.tag !== expected.tag) return void problems.push(`${where}: тег ${got.tag}`);
    if (classes(got) !== classes(expected)) problems.push(`${where}: класс «${classes(got)}» вместо «${classes(expected)}»`);
    const names = new Set([...Object.keys(got.attrs), ...Object.keys(expected.attrs)].filter((name) => !IGNORED_ATTRIBUTES.has(name)));
    for (const name of names) {
      const a = got.attrs[name];
      const e = expected.attrs[name];
      if (a === undefined || e === undefined) {
        problems.push(`${where}: нет атрибута ${name} ${a === undefined ? "в компоненте" : "в рисунке"}`);
        continue;
      }
      const problem = name === "aria-label" ? (a === withoutSampleWording(e) ? null : `aria-label: «${a}» вместо «${withoutSampleWording(e)}»`) : attributeProblem(name, a, e);
      if (problem) problems.push(`${where}: ${problem}`);
    }
    const expectedText = tagHasText(expected.tag) ? withoutSampleWording(expected.text) : expected.text;
    if (got.text !== expectedText) problems.push(`${where}: текст «${got.text}» вместо «${expectedText}»`);
  });
  return problems;
}
const tagHasText = (tag: string) => tag === "title";

const render = (chart: Parameters<typeof NatalWheel>[0]["chart"], birth: Parameters<typeof NatalWheel>[0]["birth"]) => renderToStaticMarkup(<NatalWheel chart={chart} birth={birth} />);
const svgOf = (markup: string) => /<svg[\s\S]*<\/svg>/.exec(markup)?.[0] ?? "";

describe("NatalWheel against the accepted artwork", () => {
  test("with time: same elements, classes, data attributes and numbers as natal-wheel.svg", () => {
    const markup = render(sampleChart(true), SAMPLE_BIRTH);
    expect(compareToAccepted(svgOf(markup), readMockup("natal-wheel.svg"))).toEqual([]);
  });

  test("without time: same as natal-wheel-no-time.svg", () => {
    const markup = render(sampleChart(false), { ...SAMPLE_BIRTH, time: null });
    expect(compareToAccepted(svgOf(markup), readMockup("natal-wheel-no-time.svg"))).toEqual([]);
  });

  test("the same multiset of (tag, class, data attributes) as the artwork", () => {
    const signature = (elements: SvgElement[]) =>
      elements
        .map((element) => `${element.tag}|${classes(element)}|${Object.entries(element.attrs).filter(([name]) => name.startsWith("data-") && name !== "data-cusp" && !name.endsWith("longitude")).sort().join(",")}`)
        .sort();
    for (const [chart, birth, file] of [
      [sampleChart(true), SAMPLE_BIRTH, "natal-wheel.svg"],
      [sampleChart(false), { ...SAMPLE_BIRTH, time: null }, "natal-wheel-no-time.svg"],
    ] as const) {
      expect(signature(parseSvg(svgOf(render(chart, birth))))).toEqual(signature(parseSvg(readMockup(file))));
    }
  });

  test("carries no style, no embedded font and no copy of the glyphs", () => {
    const markup = render(sampleChart(true), SAMPLE_BIRTH);
    expect(markup).not.toMatch(/<style|<defs|<symbol|font-face|<image|xlink/);
    expect(markup.match(/<use\b/g)?.length).toBeGreaterThan(20);
    expect(markup.match(/href="#glyph-[a-z]+"/g)?.length).toBe(markup.match(/<use\b/g)?.length);
  });

  test("the accepted artwork test is not vacuous: a changed number is noticed", () => {
    const markup = svgOf(render(sampleChart(true), SAMPLE_BIRTH));
    const moved = markup.replace(/(class="wheel-position" cx=")[\d.]+/, "$1999");
    expect(compareToAccepted(moved, readMockup("natal-wheel.svg")).length).toBeGreaterThan(0);
    const reclassed = markup.replace('class="wheel-aspect"', 'class="wheel-chord"');
    expect(compareToAccepted(reclassed, readMockup("natal-wheel.svg")).length).toBeGreaterThan(0);
  });
});

describe("NatalWheel markup", () => {
  const withTime = render(sampleChart(true), SAMPLE_BIRTH);
  const noTime = render(sampleChart(false), { ...SAMPLE_BIRTH, time: null });

  test("is a figure.natal-wheel with the svg first and the caption after it", () => {
    expect(withTime).toMatch(/^<figure class="natal-wheel"><svg viewBox="0 0 720 720" role="img" aria-label="[^"]+">/);
    expect(withTime).toMatch(/<\/svg><figcaption class="natal-wheel__caption">Москва · 7 марта 1990 · 12:00<\/figcaption><\/figure>$/);
    expect(noTime).toMatch(/<figcaption class="natal-wheel__caption">Время неизвестно<\/figcaption>/);
  });

  test("describes the wheel for screen readers with real data, never with the sample wording", () => {
    expect(withTime).toContain("Колесо натальной карты: Солнце в Рыбах, Луна в Раке, асцендент в Раке. Дома: Плацидус. Данные рождения: Москва, 7 марта 1990, 12:00.");
    expect(withTime).not.toContain("образца");
    expect(noTime).not.toContain("образца");
    expect(noTime).toContain("Колесо натальной карты без времени рождения: планеты на местный полдень.");
  });

  test("draws houses and the AC and MC axes only when the time is known", () => {
    expect(withTime).toContain('class="wheel-houses"');
    expect(withTime).toContain('data-angle="asc"');
    expect(withTime).toContain('data-angle="mc"');
    expect(noTime).not.toContain("wheel-houses");
    expect(noTime).not.toContain("data-angle");
    expect(noTime).toContain('class="wheel-centre"');
    expect(withTime).not.toContain("wheel-centre");
  });

  test("marks the Moon whose sign may have changed, and only without time", () => {
    expect(noTime.match(/wheel-moon-warning/g)).toHaveLength(1);
    expect(withTime).not.toContain("wheel-moon-warning");
  });

  test("writes data-body from the model, the lunar node as node", () => {
    expect(withTime).toContain('data-body="node"');
    expect(withTime).not.toContain("northNode");
    expect(withTime).toContain('href="#glyph-node"');
  });

  test("renders a real chart from the core too", () => {
    const real = render(realChart("Москва", "1990-03-07", "12:00"), SAMPLE_BIRTH);
    expect(real.match(/class="wheel-point"/g)).toHaveLength(11);
    expect(real.match(/class="wheel-sign"/g)).toHaveLength(12);
    expect(real.match(/class="wheel-tick/g)).toHaveLength(360);
  });
});
