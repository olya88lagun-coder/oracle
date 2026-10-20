import type { NatalChart } from "@oracle/core/natal";
import { describe, expect, test } from "vitest";
import { sampleChart } from "@/components/natal/sample-chart.test-support";
import { FOCUS_ASPECT_LINES, FOCUS_REPORT_LINE, FOCUS_TITLE, findFocus, focusItems } from "./natal-focus";

// Образец — Москва, 7 марта 1990, 12:00: самый тесный аспект — Солнце и Плутон (трин, 1°11′), в Козероге четыре планеты
const withTime = sampleChart(true);
const noTime = sampleChart(false);
const empty = (chart: NatalChart): NatalChart => ({ ...chart, aspects: [], points: chart.points.map((point, index) => ({ ...point, sign: (["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"] as const)[index % 12] ?? "aries" })) });

describe("findFocus", () => {
  test("picks the aspect with the smallest orb", () => {
    const { aspect } = findFocus(withTime);
    const smallest = Math.min(...withTime.aspects.map((item) => item.orb));
    expect(aspect?.orb).toBe(smallest);
    expect(new Set([aspect?.a, aspect?.b])).toEqual(new Set(["sun", "pluto"]));
  });

  test("on equal orbs keeps the first aspect of the chart", () => {
    const [first, second] = withTime.aspects;
    if (!first || !second) throw new Error("в образце меньше двух аспектов");
    const tied: NatalChart = { ...withTime, aspects: [{ ...first, orb: 0.5 }, { ...second, orb: 0.5 }] };
    expect(findFocus(tied).aspect).toEqual({ ...first, orb: 0.5 });
  });

  test("finds a stellium: three or more planets in one sign, in the order of the chart, never the lunar node", () => {
    const { stellium } = findFocus(withTime);
    expect(stellium?.sign).toBe("capricorn");
    expect(stellium?.bodies).toEqual(["mars", "saturn", "uranus", "neptune"]);
  });

  test("has no stellium when no sign holds three planets", () => {
    expect(findFocus(empty(withTime)).stellium).toBeNull();
  });

  test("does not count a body whose sign may change during the day", () => {
    const uncertain: NatalChart = { ...withTime, uncertainSigns: ["saturn"] };
    expect(findFocus(uncertain).stellium?.bodies).toEqual(["mars", "uranus", "neptune"]);
    expect(findFocus({ ...withTime, uncertainSigns: ["saturn", "uranus"] }).stellium).toBeNull();
  });

  test("with the biggest group tied, takes the sign that comes first in the zodiac", () => {
    const chart: NatalChart = {
      ...withTime,
      uncertainSigns: [],
      points: withTime.points.map((point) => {
        const sign = (["sun", "moon", "mercury"] as const).includes(point.id as never) ? "taurus" : (["venus", "mars", "jupiter"] as const).includes(point.id as never) ? "aries" : "leo";
        return { ...point, sign };
      }),
    };
    // Овен: Венера, Марс, Юпитер; Телец: Солнце, Луна, Меркурий; Лев: остальные (Сатурн, Уран, Нептун, Плутон) — их четыре, они и побеждают
    expect(findFocus(chart).stellium?.sign).toBe("leo");
  });

  test("works without the birth time: no aspects of the Moon, nothing is invented", () => {
    const focus = findFocus(noTime);
    expect(focus.aspect === null || (focus.aspect.a !== "moon" && focus.aspect.b !== "moon")).toBe(true);
  });
});

describe("focusItems", () => {
  const items = focusItems(withTime);

  test("describes the aspect first, then the stellium", () => {
    expect(items.map((item) => item.kind)).toEqual(["aspect", "stellium"]);
  });

  test("the aspect item names the pair, its angle and its accuracy, and explains both themes", () => {
    const aspect = items[0];
    expect(aspect?.title).toBe("Солнце — Плутон: трин");
    expect(aspect?.meta).toBe("точность 1°11′");
    expect(aspect?.text).toContain("Солнце — сознание и воля");
    expect(aspect?.text).toContain("Плутон — глубина и преобразование");
    expect(aspect?.text).toContain(FOCUS_ASPECT_LINES.trine);
  });

  test("the stellium item counts the planets, names them and gives the sign keywords", () => {
    const stellium = items[1];
    expect(stellium?.title).toBe("Четыре планеты в Козероге");
    expect(stellium?.meta).toBe("Марс, Сатурн, Уран и Нептун");
    expect(stellium?.text).toContain("дисциплина, цели, ответственность");
  });

  test("declines the planets correctly for 3, 4 and 5 or more", () => {
    const OTHER_SIGNS = ["aries", "taurus", "gemini", "cancer", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"] as const;
    const withCount = (count: number) => {
      const chart: NatalChart = { ...withTime, uncertainSigns: [], points: withTime.points.map((point, index) => ({ ...point, sign: index < count ? "leo" : OTHER_SIGNS[index % OTHER_SIGNS.length] ?? "aries" })) };
      return focusItems(chart).find((item) => item.kind === "stellium")?.title;
    };
    expect(withCount(3)).toBe("Три планеты во Льве");
    expect(withCount(5)).toBe("Пять планет во Льве");
  });

  test("returns nothing for a chart without aspects and stellium", () => {
    expect(focusItems(empty(withTime))).toEqual([]);
  });

  test("never promises or predicts", () => {
    const all = [FOCUS_TITLE, FOCUS_REPORT_LINE, ...Object.values(FOCUS_ASPECT_LINES), ...items.map((item) => `${item.title} ${item.meta ?? ""} ${item.text}`)].join(" ");
    expect(all).not.toMatch(/будет|ждёт|ждет|судьб|предсказ|обязательно|всегда|никогда|гарант/i);
  });
});
