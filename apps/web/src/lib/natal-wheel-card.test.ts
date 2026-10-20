import type { ChartPoint, NatalChart } from "@oracle/core/natal";
import { describe, expect, test } from "vitest";
import { sampleChart } from "@/components/natal/sample-chart.test-support";
import { buildWheel } from "./natal-wheel";
import {
  ANGLE_KEYWORDS,
  BODY_KEYWORDS,
  HOUSE_KEYWORDS,
  SIGN_KEYWORDS,
  WHEEL_CARD_HINT,
  describeSelection,
  hitTest,
  initialWheelState,
  relatedBodies,
  selectionArc,
  selectionKey,
  shownSelection,
  wheelReducer,
  type WheelSelection,
} from "./natal-wheel-card";

// Образец — Москва, 7 марта 1990, 12:00: Солнце в Рыбах (16°), Луна в Раке, асцендент в Раке, дома Плацидуса
const withTime = sampleChart(true);
const noTime = sampleChart(false);
const body = (id: ChartPoint["id"]): WheelSelection => ({ kind: "body", id });

const centreOf = (chart: NatalChart, id: string) => {
  const model = buildWheel(chart);
  const point = model.points.find((item) => item.id === id);
  if (!point) throw new Error(`нет точки ${id}`);
  return { x: point.glyphBox.x + point.glyphBox.width / 2, y: point.glyphBox.y + point.glyphBox.height / 2 };
};

describe("keywords", () => {
  test("cover every body, sign, house and axis", () => {
    expect(Object.keys(BODY_KEYWORDS)).toHaveLength(11);
    expect(Object.keys(SIGN_KEYWORDS)).toHaveLength(12);
    expect(Object.keys(HOUSE_KEYWORDS)).toHaveLength(12);
    expect(Object.keys(ANGLE_KEYWORDS)).toEqual(["ascendant", "midheaven"]);
  });

  test("never promise or predict anything", () => {
    const all = [...Object.values(BODY_KEYWORDS), ...Object.values(SIGN_KEYWORDS), ...Object.values(HOUSE_KEYWORDS), ...Object.values(ANGLE_KEYWORDS), WHEEL_CARD_HINT].join(" ");
    expect(all).not.toMatch(/будет|ждёт|ждет|судьб|предсказ|обязательно|всегда|никогда/i);
  });
});

describe("describeSelection for a body", () => {
  const sun = describeSelection(withTime, body("sun"));

  test("titles the card with sign, degrees and house", () => {
    expect(sun?.title).toMatch(/^Солнце в Рыбах · 16°32′ · 10 дом$/);
  });

  test("explains the planet, the sign and the house in plain words", () => {
    expect(sun?.rows.map((row) => row.label)).toEqual(expect.arrayContaining(["Планета", "Знак", "Дом"]));
    expect(sun?.rows.find((row) => row.label === "Планета")?.text).toBe(BODY_KEYWORDS.sun);
    expect(sun?.rows.find((row) => row.label === "Знак")?.text).toContain(SIGN_KEYWORDS.pisces);
  });

  test("lists aspects of this body, tightest first, with the partner and the aspect", () => {
    const row = sun?.rows.find((item) => item.label === "Аспекты");
    const partners = withTime.aspects.filter((aspect) => aspect.a === "sun" || aspect.b === "sun");
    expect(partners.length).toBeGreaterThan(0);
    expect(row?.text.split(", ")).toHaveLength(partners.length);
    expect(row?.text).toMatch(/\((соединение|секстиль|квадрат|трин|оппозиция)\)/);
  });

  test("links to the meaning page only when it is published", () => {
    expect(describeSelection(withTime, body("sun"), { "sun-pisces": { summary: "x", href: "/natalnaya-karta/solntse-v-ribah" } })?.link).toEqual({ href: "/natalnaya-karta/solntse-v-ribah", label: "Значение: Солнце в Рыбах" });
    expect(describeSelection(withTime, body("sun"), {})?.link).toBeNull();
    expect(describeSelection(withTime, body("northNode"), { "northNode-pisces": { summary: "x", href: "/x" } })?.link).toBeNull();
  });

  test("leaves out the house row without the birth time", () => {
    const card = describeSelection(noTime, body("sun"));
    expect(card?.title).not.toContain("дом");
    expect(card?.rows.map((row) => row.label)).not.toContain("Дом");
  });

  test("says why the moon has no aspects without the birth time", () => {
    expect(describeSelection(noTime, body("moon"))?.note).toContain("Аспекты Луны без времени рождения не считаются");
  });

  test("returns null for a body that is not in the chart", () => {
    expect(describeSelection({ ...withTime, points: withTime.points.filter((point) => point.id !== "sun") }, body("sun"))).toBeNull();
  });
});

describe("describeSelection for axes, signs and houses", () => {
  test("describes the ascendant and links it when the text is published", () => {
    const card = describeSelection(withTime, { kind: "angle", id: "ascendant" }, { "ascendant-cancer": { summary: "x", href: "/natalnaya-karta/ascendent-v-rake" } });
    expect(card?.title).toMatch(/^Асцендент в Раке · \d+°\d{2}′$/);
    expect(card?.link?.label).toBe("Значение: Асцендент в Раке");
    expect(describeSelection(withTime, { kind: "angle", id: "midheaven" })?.link).toBeNull();
  });

  test("has no axes without the birth time", () => {
    expect(describeSelection(noTime, { kind: "angle", id: "ascendant" })).toBeNull();
  });

  test("describes a sign with the planets standing in it", () => {
    const card = describeSelection(withTime, { kind: "sign", sign: "pisces" });
    expect(card?.title).toBe("Рыбы");
    expect(card?.rows.find((row) => row.label === "Планеты в знаке")?.text).toContain("Солнце");
  });

  test("describes a house with its sign and planets", () => {
    const card = describeSelection(withTime, { kind: "house", house: 10 });
    expect(card?.title).toBe("10 дом в Рыбах");
    expect(card?.rows.find((row) => row.label === "Дом")?.text).toBe(HOUSE_KEYWORDS[10]);
    expect(card?.rows.find((row) => row.label === "Планеты в доме")?.text).toContain("Солнце");
  });

  test("has no houses without the birth time", () => {
    expect(describeSelection(noTime, { kind: "house", house: 1 })).toBeNull();
  });
});

describe("relatedBodies", () => {
  test("for a body: itself and its aspect partners", () => {
    const partners = withTime.aspects.filter((aspect) => aspect.a === "sun" || aspect.b === "sun").map((aspect) => (aspect.a === "sun" ? aspect.b : aspect.a));
    expect([...relatedBodies(withTime, body("sun"))].sort()).toEqual(["sun", ...partners].sort());
  });

  test("for a sign and a house: the points inside", () => {
    expect(relatedBodies(withTime, { kind: "sign", sign: "pisces" }).has("sun")).toBe(true);
    const inHouse = withTime.points.filter((point) => point.house === 10).map((point) => point.id);
    expect([...relatedBodies(withTime, { kind: "house", house: 10 })].sort()).toEqual([...inHouse].sort());
  });
});

describe("selectionArc", () => {
  test("draws a closed ring sector for a sign and for a house", () => {
    for (const selection of [{ kind: "sign", sign: "pisces" }, { kind: "house", house: 10 }] as const) {
      const path = selectionArc(withTime, selection);
      expect(path).toMatch(/^M[-\d. ]+A[\d. ]+0 [01] 0 [-\d. ]+L[-\d. ]+A[\d. ]+0 [01] 1 [-\d. ]+Z$/);
    }
  });

  test("has nothing to draw for bodies, axes and houses without the time", () => {
    expect(selectionArc(withTime, body("sun"))).toBeNull();
    expect(selectionArc(withTime, { kind: "angle", id: "ascendant" })).toBeNull();
    expect(selectionArc(noTime, { kind: "house", house: 3 })).toBeNull();
    expect(selectionArc(noTime, { kind: "sign", sign: "aries" })).not.toBeNull();
  });
});

describe("hitTest", () => {
  test("finds a body by its glyph", () => {
    for (const point of withTime.points) {
      const { x, y } = centreOf(withTime, point.id);
      expect(hitTest(buildWheel(withTime), withTime, x, y)).toEqual({ kind: "body", id: point.id });
    }
  });

  test("finds a sign in the zodiac ring and a house in the house ring", () => {
    const model = buildWheel(withTime);
    // Центр знака Рыб — на долготе 345°; асцендент (104.1°) стоит на 9 часах, значит угол на экране 180 + 345 − 104.1
    const signAngle = ((180 + 345 - 104.1) * Math.PI) / 180;
    const signHit = hitTest(model, withTime, 360 + 285 * Math.cos(signAngle), 360 - 285 * Math.sin(signAngle));
    expect(signHit).toEqual({ kind: "sign", sign: "pisces" });
    // Куспид 11-го дома рядом с Рыбами: любая точка в кольце домов даёт дом
    const houseHit = hitTest(model, withTime, 360 + 130 * Math.cos(signAngle), 360 - 130 * Math.sin(signAngle));
    expect(houseHit?.kind).toBe("house");
  });

  test("finds the axes by their labels and never a house without the time", () => {
    const model = buildWheel(withTime);
    const ac = model.angles?.ascendant.text;
    expect(ac && hitTest(model, withTime, ac.x, ac.y)).toEqual({ kind: "angle", id: "ascendant" });
    const noTimeModel = buildWheel(noTime);
    for (const [x, y] of [[360 + 130, 360], [360, 360 - 130], [360 - 130, 360]] as const) {
      expect(hitTest(noTimeModel, noTime, x, y)?.kind).not.toBe("house");
    }
  });

  test("finds nothing in the empty centre and outside the wheel", () => {
    const model = buildWheel(withTime);
    expect(hitTest(model, withTime, 360, 360)).toBeNull();
    expect(hitTest(model, withTime, 5, 5)).toBeNull();
  });
});

describe("wheelReducer", () => {
  const sun = body("sun");
  const moon = body("moon");

  test("a tap pins a selection and a second tap on it releases it", () => {
    const pinned = wheelReducer(initialWheelState, { type: "tap", target: sun });
    expect(shownSelection(pinned)).toEqual(sun);
    expect(shownSelection(wheelReducer(pinned, { type: "tap", target: sun }))).toBeNull();
  });

  test("a tap on an empty place releases the pinned selection", () => {
    const pinned = wheelReducer(initialWheelState, { type: "tap", target: sun });
    expect(shownSelection(wheelReducer(pinned, { type: "tap", target: null }))).toBeNull();
  });

  test("hover previews another selection and gives the pinned one back on leaving", () => {
    const pinned = wheelReducer(initialWheelState, { type: "tap", target: sun });
    const hovering = wheelReducer(pinned, { type: "hover", target: moon });
    expect(shownSelection(hovering)).toEqual(moon);
    expect(shownSelection(wheelReducer(hovering, { type: "hover", target: null }))).toEqual(sun);
  });

  test("hovering the same place again keeps the very same state", () => {
    const hovering = wheelReducer(initialWheelState, { type: "hover", target: sun });
    expect(wheelReducer(hovering, { type: "hover", target: body("sun") })).toBe(hovering);
    expect(wheelReducer(initialWheelState, { type: "hover", target: null })).toBe(initialWheelState);
  });

  test("Escape clears both", () => {
    const state = wheelReducer(wheelReducer(initialWheelState, { type: "tap", target: sun }), { type: "hover", target: moon });
    expect(shownSelection(wheelReducer(state, { type: "clear" }))).toBeNull();
  });

  test("equal selections have equal keys", () => {
    expect(selectionKey(sun)).toBe(selectionKey(body("sun")));
    expect(selectionKey(sun)).not.toBe(selectionKey(moon));
    expect(selectionKey({ kind: "house", house: 3 })).not.toBe(selectionKey({ kind: "sign", sign: "aries" }));
  });
});
