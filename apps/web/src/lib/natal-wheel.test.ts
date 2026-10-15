import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  BODIES,
  computeNatalChart,
  findAspects,
  signOf,
  type BodyId,
  type ChartPoint,
  type Cusps,
  type NatalChart,
} from "@oracle/core/natal";
import {
  LABEL_SEPARATION,
  WHEEL_CENTRE,
  WHEEL_RADIUS,
  buildWheel,
  spreadLabels,
  wheelAngle,
  wheelAriaLabel,
  wheelPoints,
  type WheelModel,
} from "./natal-wheel";

// ---------- принятый рисунок: docs/design/mockups/natal (только чтение; файлы принадлежат дизайнеру) ----------

const MOCKUP_DIR = fileURLToPath(new URL("../../../../docs/design/mockups/natal/", import.meta.url));
const readMockup = (name: string) => readFileSync(`${MOCKUP_DIR}${name}`, "utf8");

type SvgElement = { tag: string; attrs: Record<string, string>; text: string };

// Мелкий разборщик SVG без DOM: элементы в порядке документа, тексты у text/title, без defs, style и комментариев
function parseSvg(source: string): SvgElement[] {
  const body = source.replace(/<!--[\s\S]*?-->/g, "").replace(/<defs>[\s\S]*?<\/defs>/g, "").replace(/<style>[\s\S]*?<\/style>/g, "");
  const elements: SvgElement[] = [];
  for (const match of body.matchAll(/<(text|title)\b([^>]*)>([^<]*)<\/\1>|<([a-zA-Z]+)\b([^>]*?)\/?>/g)) {
    const tag = match[1] ?? (match[4] as string);
    const rawAttrs = match[1] ? (match[2] as string) : (match[5] as string);
    const attrs: Record<string, string> = {};
    for (const attr of rawAttrs.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[attr[1] as string] = attr[2] as string;
    elements.push({ tag, attrs, text: match[3] ?? "" });
  }
  return elements;
}

const hasClass = (element: SvgElement, name: string) => (element.attrs.class ?? "").split(/\s+/).includes(name);
const withClass = (elements: SvgElement[], name: string) => elements.filter((element) => hasClass(element, name));
const attr = (element: SvgElement, name: string): string => {
  const value = element.attrs[name];
  if (value === undefined) throw new Error(`нет атрибута ${name} у <${element.tag}>`);
  return value;
};
const num = (element: SvgElement, name: string) => Number(attr(element, name));

// ---------- сверка с допуском 0,01 пользовательской единицы ----------

const TOLERANCE = 0.01;
// Прозрачность в рисунке записана с тремя знаками и посчитана по неокруглённым долготам, а образец собран из округлённых до сотых
const OPACITY_TOLERANCE = 0.0015;
let maxDeviation = 0;
let maxCoordinateDeviation = 0;
let maxOpacityDeviation = 0;
function close(label: string, actual: number, expected: number, tolerance = TOLERANCE): void {
  const deviation = Math.abs(actual - expected);
  maxDeviation = Math.max(maxDeviation, deviation);
  if (label.includes("opacity")) maxOpacityDeviation = Math.max(maxOpacityDeviation, deviation);
  else maxCoordinateDeviation = Math.max(maxCoordinateDeviation, deviation);
  if (!(deviation <= tolerance)) throw new Error(`${label}: модель ${actual}, рисунок ${expected}, расхождение ${deviation.toFixed(4)}`);
}
// Углы поворота сравниваются по модулю 360
function closeAngle(label: string, actual: number, expected: number): void {
  const wrapped = ((((actual - expected) % 360) + 540) % 360) - 180;
  close(label, wrapped, 0);
}

// ---------- образец: Москва, 7 марта 1990, 12:00 ----------

type Contract = {
  sample_points: { id: string; longitude: number; degrees: string; house: number; retrograde: boolean }[];
  cusps: number[];
  label_longitudes: Record<string, number>;
  aspect_count: number;
  no_time_aspect_count: number;
};
const contract = JSON.parse(readMockup("visual-contract.json")) as Contract;

const SAMPLE_ASCENDANT = 104.13;
const SAMPLE_MIDHEAVEN = 335.64;
const chartId = (id: string): ChartPoint["id"] => (id === "node" ? "northNode" : (id as BodyId));
const svgBody = (id: ChartPoint["id"]) => (id === "northNode" ? "node" : id);

// «16°32′» → 16 + 32/60: подпись градусов в рисунке считалась по неокруглённой долготе (у Юпитера 90.99 → «1°00′»), поэтому берём её из контракта
const degreesOf = (text: string) => {
  const match = /^(\d+)°(\d{2})′$/.exec(text);
  if (!match) throw new Error(`не разобрать ${text}`);
  return Number(match[1]) + Number(match[2]) / 60;
};

function sampleChart(withTime: boolean): NatalChart {
  const points: ChartPoint[] = contract.sample_points.map((sample) => ({
    id: chartId(sample.id),
    longitude: sample.longitude,
    sign: signOf(sample.longitude).sign,
    degree: degreesOf(sample.degrees),
    retrograde: sample.retrograde,
    house: withTime ? sample.house : null,
  }));
  const longitudes = Object.fromEntries(BODIES.map((body) => [body, points.find((point) => point.id === body)?.longitude ?? Number.NaN])) as Record<BodyId, number>;
  const aspectBodies = withTime ? BODIES : BODIES.filter((body) => body !== "moon");
  return {
    points,
    ascendant: withTime ? { longitude: SAMPLE_ASCENDANT, ...signOf(SAMPLE_ASCENDANT) } : null,
    midheaven: withTime ? { longitude: SAMPLE_MIDHEAVEN, ...signOf(SAMPLE_MIDHEAVEN) } : null,
    houses: withTime ? { system: "placidus", cusps: contract.cusps as Cusps } : null,
    aspects: findAspects(longitudes, aspectBodies),
    uncertainSigns: withTime ? [] : ["moon"],
    timeKnown: withTime,
  };
}

// ---------- сверка модели с одним принятым SVG ----------

function compareWithSvg(model: WheelModel, svgSource: string, withTime: boolean): void {
  const elements = parseSvg(svgSource);

  // Окружности: 306 (внешняя), 298, 263, 252 и, со временем, 143 и 112
  const circles = withClass(elements, "wheel-circle");
  expect(model.circles.map((circle) => circle.r)).toEqual(circles.map((circle) => num(circle, "r")));
  expect(model.circles.map((circle) => circle.outer)).toEqual(circles.map((circle) => hasClass(circle, "wheel-circle--outer")));

  // 360 засечек: через 1° короткая, через 5° средняя, через 10° длинная (акцентная)
  const ticks = withClass(elements, "wheel-tick");
  expect(model.ticks).toHaveLength(360);
  expect(ticks).toHaveLength(360);
  ticks.forEach((tick, index) => {
    const mine = model.ticks[index];
    if (!mine) throw new Error(`нет засечки ${index}`);
    expect(mine.major, `засечка ${index}`).toBe(hasClass(tick, "wheel-tick--major"));
    for (const key of ["x1", "y1", "x2", "y2"] as const) close(`засечка ${index} ${key}`, mine[key], num(tick, key));
  });

  // 12 линий границ знаков и 12 глифов знаков
  const sectors = withClass(elements, "wheel-sector");
  expect(model.sectors).toHaveLength(12);
  sectors.forEach((sector, index) => {
    for (const key of ["x1", "y1", "x2", "y2"] as const) close(`граница ${index} ${key}`, model.sectors[index]?.[key] ?? Number.NaN, num(sector, key));
  });
  const signs = withClass(elements, "wheel-sign");
  expect(model.signs.map((sign) => sign.sign)).toEqual(signs.map((sign) => attr(sign, "data-sign")));
  signs.forEach((sign, index) => {
    const mine = model.signs[index];
    expect(mine?.glyph).toBe(attr(sign, "href").slice(1));
    for (const key of ["x", "y", "width", "height"] as const) close(`знак ${index} ${key}`, mine?.[key] ?? Number.NaN, num(sign, key));
  });

  // Дома: линия куспида, продолжение осей (приглушённое), номер дома
  const houseLines = withClass(elements, "wheel-house-line");
  if (!withTime) {
    expect(model.houses).toBeNull();
    expect(houseLines).toHaveLength(0);
  } else {
    const cuspLines = houseLines.filter((line) => line.attrs["data-house"] !== undefined);
    const extensions = houseLines.filter((line) => line.attrs["data-house"] === undefined);
    const numbers = withClass(elements, "wheel-house-number");
    expect(model.houses).toHaveLength(12);
    expect(cuspLines).toHaveLength(12);
    expect(extensions).toHaveLength(4);
    expect(numbers).toHaveLength(12);
    cuspLines.forEach((line, index) => {
      const house = model.houses?.[index];
      if (!house) throw new Error(`нет дома ${index}`);
      expect(house.house).toBe(Number(attr(line, "data-house")));
      expect(house.cuspAttr).toBe(attr(line, "data-cusp"));
      expect(house.axis).toBe(hasClass(line, "wheel-house-line--axis"));
      for (const key of ["x1", "y1", "x2", "y2"] as const) close(`дом ${house.house} ${key}`, house.line[key], num(line, key));
      const number = numbers[index] as SvgElement;
      expect(house.number.text).toBe(number.text);
      close(`номер дома ${house.house} x`, house.number.x, num(number, "x"));
      close(`номер дома ${house.house} y`, house.number.y, num(number, "y"));
    });
    const modelExtensions = (model.houses ?? []).flatMap((house) => (house.extension ? [house.extension] : []));
    expect(modelExtensions).toHaveLength(4);
    extensions.forEach((line, index) => {
      const mine = modelExtensions[index];
      if (!mine) throw new Error(`нет продолжения оси ${index}`);
      expect(hasClass(line, "wheel-house-line--axis")).toBe(true);
      close(`ось ${index} opacity`, mine.opacity, num(line, "opacity"), OPACITY_TOLERANCE);
      for (const key of ["x1", "y1", "x2", "y2"] as const) close(`ось ${index} ${key}`, mine[key], num(line, key));
    });
  }

  // Хорды аспектов: порядок, прозрачность от точности, концы на r=108; соединение — кружок на середине дуги
  const aspects = withClass(elements, "wheel-aspect");
  expect(model.aspects).toHaveLength(aspects.length);
  aspects.forEach((element, index) => {
    const mine = model.aspects[index];
    if (!mine) throw new Error(`нет аспекта ${index}`);
    expect(mine.aspect, `аспект ${index}`).toBe(attr(element, "data-aspect"));
    close(`аспект ${index} opacity`, mine.opacity, num(element, "opacity"), OPACITY_TOLERANCE);
    if (element.tag === "circle") {
      expect(mine.shape.kind).toBe("circle");
      if (mine.shape.kind !== "circle") return;
      close(`аспект ${index} cx`, mine.shape.cx, num(element, "cx"));
      close(`аспект ${index} cy`, mine.shape.cy, num(element, "cy"));
      close(`аспект ${index} r`, mine.shape.r, num(element, "r"));
    } else {
      expect(mine.shape.kind).toBe("line");
      if (mine.shape.kind !== "line") return;
      expect(mine.bodies.join(" ")).toBe(attr(element, "data-bodies"));
      for (const key of ["x1", "y1", "x2", "y2"] as const) close(`аспект ${index} ${key}`, mine.shape[key], num(element, key));
    }
  });

  // Планеты: метка истинной позиции, выноска, глиф, знак «обратное движение», подпись градусов, предупреждение у Луны
  const leaders = elements.filter((element) => hasClass(element, "wheel-leader"));
  const positions = withClass(elements, "wheel-position");
  const groups = withClass(elements, "wheel-point");
  expect(model.points).toHaveLength(groups.length);
  expect(leaders).toHaveLength(groups.length);
  groups.forEach((group, index) => {
    const mine = model.points[index];
    if (!mine) throw new Error(`нет планеты ${index}`);
    const name = attr(group, "data-body");
    expect(mine.body).toBe(name);
    expect(mine.id).toBe(name === "node" ? "northNode" : name);
    expect(String(mine.retrograde)).toBe(attr(group, "data-retro"));
    expect(mine.longitudeAttr).toBe(attr(group, "data-longitude"));
    expect(mine.labelLongitudeAttr).toBe(attr(group, "data-label-longitude"));

    const position = positions[index] as SvgElement;
    expect(attr(position, "data-body")).toBe(name);
    close(`${name} marker cx`, mine.marker.cx, num(position, "cx"));
    close(`${name} marker cy`, mine.marker.cy, num(position, "cy"));
    close(`${name} marker r`, mine.marker.r, num(position, "r"));

    // Выноска: прямая от метки (<line>) или с изломом у сдвинутой подписи (<path M…L…L…>)
    const leader = leaders[index] as SvgElement;
    const expectedLeader =
      leader.tag === "line"
        ? [
            [num(leader, "x1"), num(leader, "y1")],
            [num(leader, "x2"), num(leader, "y2")],
          ]
        : [...attr(leader, "d").matchAll(/[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)].map((pair) => [Number(pair[1]), Number(pair[2])]);
    expect(mine.displaced, `${name}: сдвинутая подпись`).toBe(leader.tag === "path");
    expect(mine.leader).toHaveLength(expectedLeader.length);
    expectedLeader.forEach((pair, pairIndex) => {
      close(`${name} выноска ${pairIndex} x`, mine.leader[pairIndex]?.x ?? Number.NaN, pair[0] as number);
      close(`${name} выноска ${pairIndex} y`, mine.leader[pairIndex]?.y ?? Number.NaN, pair[1] as number);
    });

    // Элементы внутри <g class="wheel-point"> до следующей выноски
    const start = elements.indexOf(group);
    const next = elements.findIndex((element, position2) => position2 > start && hasClass(element, "wheel-leader"));
    const inside = elements.slice(start + 1, next === -1 ? undefined : next);
    expect(mine.title).toBe((inside.find((element) => element.tag === "title") as SvgElement).text);
    const uses = inside.filter((element) => element.tag === "use");
    const glyph = uses.find((element) => attr(element, "href") !== "#glyph-retro") as SvgElement;
    expect(mine.glyph).toBe(attr(glyph, "href").slice(1));
    for (const key of ["x", "y", "width", "height"] as const) close(`${name} глиф ${key}`, mine.glyphBox[key], num(glyph, key));
    const retro = uses.find((element) => attr(element, "href") === "#glyph-retro");
    expect(mine.retroBox === null).toBe(retro === undefined);
    if (retro && mine.retroBox) for (const key of ["x", "y", "width", "height"] as const) close(`${name} ℞ ${key}`, mine.retroBox[key], num(retro, key));

    const degree = withClass(inside, "wheel-point__degree")[0] as SvgElement;
    expect(mine.degree.text).toBe(degree.text);
    const transform = /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/.exec(attr(degree, "transform"));
    if (!transform) throw new Error(`нет transform у ${name}`);
    close(`${name} подпись x`, mine.degree.x, Number(transform[1]));
    close(`${name} подпись y`, mine.degree.y, Number(transform[2]));
    closeAngle(`${name} подпись угол`, mine.degree.rotate, Number(transform[3]));

    const warning = withClass(inside, "wheel-moon-warning")[0];
    expect(mine.warning === null, `${name}: предупреждение`).toBe(warning === undefined);
    if (warning && mine.warning) {
      close(`${name} предупреждение cx`, mine.warning.cx, num(warning, "cx"));
      close(`${name} предупреждение cy`, mine.warning.cy, num(warning, "cy"));
      close(`${name} предупреждение r`, mine.warning.r, num(warning, "r"));
      const mark = inside.find((element) => element.tag === "path" && element.attrs.class === undefined) as SvgElement;
      expect(mine.warning.mark).toBe(attr(mark, "d"));
    }
  });

  // Оси AC и MC и центральный знак
  const angleTexts = withClass(elements, "wheel-angle");
  const axisNodes = withClass(elements, "wheel-axis-node");
  if (!withTime) {
    expect(model.angles).toBeNull();
    expect(angleTexts).toHaveLength(0);
    expect(axisNodes).toHaveLength(0);
    const centre = withClass(elements, "wheel-centre");
    expect(model.centre?.r).toBe(num(centre[0] as SvgElement, "r"));
    expect(model.centre?.cross).toBe(attr(centre[1] as SvgElement, "d"));
  } else {
    expect(model.centre).toBeNull();
    expect(angleTexts.map((text) => text.text)).toEqual(["AC", "MC"]);
    [model.angles?.ascendant, model.angles?.midheaven].forEach((marker, index) => {
      const text = angleTexts[index] as SvgElement;
      const node = axisNodes[index] as SvgElement;
      expect(marker?.label).toBe(text.text);
      close(`${text.text} x`, marker?.text.x ?? Number.NaN, num(text, "x"));
      close(`${text.text} y`, marker?.text.y ?? Number.NaN, num(text, "y"));
      close(`${text.text} узел cx`, marker?.node.cx ?? Number.NaN, num(node, "cx"));
      close(`${text.text} узел cy`, marker?.node.cy ?? Number.NaN, num(node, "cy"));
      close(`${text.text} узел r`, marker?.node.r ?? Number.NaN, num(node, "r"));
    });
  }
}

describe("buildWheel reproduces the accepted artwork", () => {
  test("with a birth time: every coordinate of natal-wheel.svg", () => {
    compareWithSvg(buildWheel(sampleChart(true)), readMockup("natal-wheel.svg"), true);
  });

  test("without a birth time: every coordinate of natal-wheel-no-time.svg", () => {
    compareWithSvg(buildWheel(sampleChart(false)), readMockup("natal-wheel-no-time.svg"), false);
  });

  test("the accepted sample has the contract's number of aspects", () => {
    expect(buildWheel(sampleChart(true)).aspects).toHaveLength(contract.aspect_count);
    expect(buildWheel(sampleChart(false)).aspects).toHaveLength(contract.no_time_aspect_count);
  });

  test("the largest deviation from the artwork stays well inside 0.01 user units", () => {
    expect(maxCoordinateDeviation).toBeLessThan(0.001); // записи в рисунке округлены до тысячных
    expect(maxOpacityDeviation).toBeLessThan(OPACITY_TOLERANCE);
    expect(maxDeviation).toBeLessThan(TOLERANCE);
  });
});

describe("aria-label of the wheel", () => {
  const rootLabel = (name: string) => attr(parseSvg(readMockup(name))[0] as SvgElement, "aria-label");

  test("with time: the accepted sample sentence", () => {
    const label = wheelAriaLabel(sampleChart(true), { city: "Москва", date: "1990-03-07", time: "12:00", sample: true });
    expect(label).toBe(rootLabel("natal-wheel.svg"));
  });

  test("with time: real data are not called a sample", () => {
    const label = wheelAriaLabel(sampleChart(true), { city: "Москва", date: "1990-03-07", time: "12:00" });
    expect(label).toBe("Колесо натальной карты: Солнце в Рыбах, Луна в Раке, асцендент в Раке. Дома: Плацидус. Данные рождения: Москва, 7 марта 1990, 12:00.");
  });

  test("with time: Porphyry houses and a Leo ascendant", () => {
    const chart: NatalChart = { ...sampleChart(true), houses: { system: "porphyry", cusps: contract.cusps as Cusps }, ascendant: { longitude: 130, ...signOf(130) } };
    expect(wheelAriaLabel(chart, { city: "Мурманск", date: "1990-03-07", time: "12:00" })).toContain("асцендент во Льве. Дома: Порфирий.");
  });

  test("without time: the accepted sample sentence", () => {
    const label = wheelAriaLabel(sampleChart(false), { city: "Москва", date: "1990-03-07", time: null, sample: true });
    expect(label).toBe(rootLabel("natal-wheel-no-time.svg"));
  });

  test("without time: no sample wording, no Moon sentence when the Moon did not change sign, a count of aspects with the right plural", () => {
    const chart: NatalChart = { ...sampleChart(false), uncertainSigns: [], aspects: sampleChart(false).aspects.slice(0, 1) };
    expect(wheelAriaLabel(chart, { city: "Москва", date: "1990-03-07", time: null })).toBe(
      "Колесо натальной карты без времени рождения: планеты на местный полдень. Асцендент, MC и дома не показаны. Аспекты Луны без времени рождения не считаются. Показан 1 аспект.",
    );
    const two: NatalChart = { ...chart, aspects: sampleChart(false).aspects.slice(0, 2) };
    expect(wheelAriaLabel(two, { city: "Москва", date: "1990-03-07", time: null })).toContain("Показано 2 аспекта.");
  });

  test("without time: other bodies that changed sign are listed", () => {
    const chart: NatalChart = { ...sampleChart(false), uncertainSigns: ["sun", "moon"] };
    expect(wheelAriaLabel(chart, { city: "Москва", date: "1990-03-07", time: null })).toContain("Знак мог смениться у: Солнце, Луна.");
  });
});

// ---------- метки не ближе 10° ----------

// Предсказуемый генератор для тестов со случайными долготами
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
const normalize = (value: number) => ((value % 360) + 360) % 360;
const circularDistance = (a: number, b: number) => {
  const diff = Math.abs(normalize(a) - normalize(b));
  return diff > 180 ? 360 - diff : diff;
};

// Наименьший зазор между соседними метками по кругу (с переходом через 0/360)
function smallestRingGap(values: number[]): number {
  const sorted = values.map(normalize).sort((a, b) => a - b);
  let smallest = Number.POSITIVE_INFINITY;
  sorted.forEach((value, index) => {
    const next = index === sorted.length - 1 ? (sorted[0] as number) + 360 : (sorted[index + 1] as number);
    smallest = Math.min(smallest, next - value);
  });
  return smallest;
}

// Порядок точек по кругу не меняется: сортировка по меткам даёт ту же последовательность с точностью до поворота
function sameRingOrder(truth: number[], labels: number[]): boolean {
  const byValue = (values: number[]) => values.map((value, index) => ({ value: normalize(value), index })).sort((a, b) => a.value - b.value || a.index - b.index).map((item) => item.index);
  const expected = byValue(truth);
  const actual = byValue(labels);
  const offset = actual.indexOf(expected[0] as number);
  return expected.every((index, position) => actual[(offset + position) % actual.length] === index);
}

describe("spreadLabels", () => {
  test("the separation is the accepted contract's 10 degrees", () => {
    expect(LABEL_SEPARATION).toBe(10);
  });

  test("reproduces the accepted sample: six crowded bodies at 272…322, everything else where it stands", () => {
    const truth = contract.sample_points.map((point) => point.longitude);
    const labels = spreadLabels(truth);
    contract.sample_points.forEach((point, index) => {
      const expected = contract.label_longitudes[point.id] ?? point.longitude;
      expect(labels[index], point.id).toBe(expected);
    });
  });

  test("an empty list and a single point", () => {
    expect(spreadLabels([])).toEqual([]);
    expect(spreadLabels([123.456])).toEqual([123.456]);
  });

  test("points at least 10 degrees apart do not move, 10 exactly included", () => {
    expect(spreadLabels([0, 10, 20, 100, 350])).toEqual([0, 10, 20, 100, 350]); // 350 и 0 — ровно 10° через шов
  });

  test("two close points are pushed apart symmetrically", () => {
    expect(spreadLabels([100, 104])).toEqual([97, 107]);
  });

  test("a 12-body pile-up on one longitude becomes an even row in input order", () => {
    const labels = spreadLabels(Array.from({ length: 12 }, () => 100));
    expect(labels).toEqual([45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155]);
  });

  test("a cluster across 0/360 is spread across the seam and keeps its order", () => {
    expect(spreadLabels([355, 358, 2, 5])).toEqual([345, 355, 5, 15]);
    const piled = spreadLabels(Array.from({ length: 12 }, () => 0));
    expect(smallestRingGap(piled)).toBeGreaterThanOrEqual(LABEL_SEPARATION - 1e-9);
    expect(sameRingOrder(Array.from({ length: 12 }, () => 0), piled)).toBe(true);
    expect(piled[0]).toBe(305);
    expect(piled[11]).toBe(55);
  });

  test("a spread cluster that runs into its neighbour pulls it in", () => {
    // Скопление из четырёх раздвигается до 40°, соседняя точка на 110 попадает в зазор и входит в скопление
    const truth = [100, 101, 102, 103, 112];
    const labels = spreadLabels(truth);
    expect(smallestRingGap(labels)).toBeGreaterThanOrEqual(LABEL_SEPARATION - 1e-9);
    expect(sameRingOrder(truth, labels)).toBe(true);
  });

  test("random sets of up to 11 points: separation at least 10, ring order kept, far loners stay (fixed seed)", () => {
    const random = mulberry32(20260715);
    for (let trial = 0; trial < 400; trial += 1) {
      const count = 1 + Math.floor(random() * 11);
      // Часть наборов нарочно собрана в один сектор, чтобы получались скопления
      const crowd = trial % 2 === 0 ? 40 : 360;
      const base = random() * 360;
      const truth = Array.from({ length: count }, () => normalize(base + random() * crowd));
      const labels = spreadLabels(truth);
      expect(labels, `набор ${trial}`).toHaveLength(count);
      if (count > 1) expect(smallestRingGap(labels), `набор ${trial}: ${JSON.stringify(truth)}`).toBeGreaterThanOrEqual(LABEL_SEPARATION - 1e-9);
      expect(sameRingOrder(truth, labels), `порядок, набор ${trial}`).toBe(true);
      truth.forEach((value, index) => {
        const nearest = Math.min(...truth.filter((_, other) => other !== index).map((other) => circularDistance(value, other)), 360);
        // Скопление из 10 других точек занимает не больше 100°: точка дальше 120° от остальных не сдвигается
        if (nearest >= 120) expect(labels[index], `одиночка, набор ${trial}`).toBe(value);
      });
    }
  });

  test("a lone point never moves, whatever the others do", () => {
    expect(spreadLabels([200, 20, 22, 24])[0]).toBe(200);
    expect(spreadLabels([90.123456])).toEqual([90.123456]);
  });

  test("is deterministic and does not depend on the input order of the points", () => {
    const random = mulberry32(7);
    const truth = Array.from({ length: 11 }, () => 250 + random() * 60);
    const first = spreadLabels(truth);
    expect(spreadLabels(truth)).toEqual(first);
    const order = truth.map((_, index) => index).sort((a, b) => (a * 7) % 11 - (b * 7) % 11);
    const shuffled = spreadLabels(order.map((index) => truth[index] as number));
    order.forEach((original, position) => expect(shuffled[position]).toBe(first[original]));
  });

  test("does not change its input", () => {
    const truth = Object.freeze([100, 101, 102]) as readonly number[];
    expect(() => spreadLabels(truth)).not.toThrow();
    expect(truth).toEqual([100, 101, 102]);
  });

  test("labels are whole degrees only where a cluster was spread", () => {
    const labels = spreadLabels([100.3, 101.1, 250.25]);
    expect(Number.isInteger(labels[0])).toBe(true);
    expect(Number.isInteger(labels[1])).toBe(true);
    expect(labels[2]).toBe(250.25);
  });
});

// ---------- углы на колесе: образец и настоящее ядро ----------

describe("wheelPoints", () => {
  test("with time the ascendant is at 9 o'clock and the zodiac runs counterclockwise", () => {
    expect(wheelAngle(SAMPLE_ASCENDANT, SAMPLE_ASCENDANT)).toBe(180);
    // Против часовой стрелки: +90° долготы — это поворот на 90° против часовой, то есть вниз (270° экранного угла)
    expect(wheelAngle(SAMPLE_ASCENDANT + 90, SAMPLE_ASCENDANT)).toBeCloseTo(270, 9);
    // МС образца — справа вверху (экранный угол ≈ 51.5°)
    expect(wheelAngle(SAMPLE_MIDHEAVEN, SAMPLE_ASCENDANT)).toBeCloseTo(51.51, 9);
  });

  test("without time 0° of Aries is at 9 o'clock", () => {
    const points = wheelPoints(sampleChart(false));
    const sun = points.find((point) => point.id === "sun");
    expect(sun?.angle).toBeCloseTo(normalize(180 + 346.53), 9);
    expect(wheelPoints({ ...sampleChart(false), points: [{ ...(sampleChart(false).points[0] as ChartPoint), longitude: 0 }] })[0]?.angle).toBe(180);
  });

  test("real core output for Moscow, 7 March 1990 12:00 matches the table of the accepted contract", () => {
    const chart = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown: true });
    const points = wheelPoints(chart);
    expect(points).toHaveLength(contract.sample_points.length);
    for (const sample of contract.sample_points) {
      const mine = points.find((point) => point.id === chartId(sample.id));
      const label = contract.label_longitudes[sample.id] ?? sample.longitude;
      // Допуск 0,05° — в контракте долготы округлены до сотых
      expect(circularDistance(mine?.angle ?? Number.NaN, 180 + sample.longitude - SAMPLE_ASCENDANT), `${sample.id}: истинный угол`).toBeLessThan(0.05);
      expect(circularDistance(mine?.labelAngle ?? Number.NaN, 180 + label - SAMPLE_ASCENDANT), `${sample.id}: угол подписи`).toBeLessThan(0.05);
    }
  });

  test("the whole model builds from the real core output, with and without time", () => {
    const withTime = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown: true });
    const model = buildWheel(withTime);
    expect(model.ticks).toHaveLength(360);
    expect(model.houses).toHaveLength(12);
    expect(model.points).toHaveLength(11);
    expect(model.aspects).toHaveLength(14);
    expect(model.angles).not.toBeNull();
    const ascendant = model.angles?.ascendant;
    expect(ascendant?.node.cx).toBeCloseTo(WHEEL_CENTRE - WHEEL_RADIUS.outer, 6); // АС всегда на 9 часов
    expect(ascendant?.node.cy).toBeCloseTo(WHEEL_CENTRE, 6);

    const noTime = buildWheel(computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown: false }));
    expect(noTime.houses).toBeNull();
    expect(noTime.angles).toBeNull();
    expect(noTime.centre).not.toBeNull();
    expect(noTime.aspects.every((aspect) => !aspect.bodies.includes("moon"))).toBe(true);
  });

  test("a chart that claims a known time but has no angles is drawn as a chart without time", () => {
    const broken: NatalChart = { ...sampleChart(true), ascendant: null };
    const model = buildWheel(broken);
    expect(model.houses).toBeNull();
    expect(model.angles).toBeNull();
  });

  test("the model does not change the chart", () => {
    const chart = sampleChart(true);
    const before = JSON.stringify(chart);
    buildWheel(chart);
    wheelPoints(chart);
    expect(JSON.stringify(chart)).toBe(before);
  });

  test("only conjunctions are drawn as circles", () => {
    const model = buildWheel(sampleChart(true));
    expect(model.aspects.filter((aspect) => aspect.shape.kind === "circle").every((aspect) => aspect.aspect === "conjunction")).toBe(true);
  });
});
