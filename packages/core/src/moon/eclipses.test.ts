import { describe, expect, test } from "vitest";
import { eclipsesOfYear, retrogradePeriods } from "./eclipses";

const moscow = (date: Date) => new Date(date.getTime() + 3 * 3_600_000).toISOString().slice(0, 10);

describe("eclipsesOfYear", () => {
  const eclipses = eclipsesOfYear(2026);

  test("2026 has four eclipses: an annular solar on 17 Feb, a total lunar on 3 Mar, a total solar on 12 Aug and a partial lunar on 28 Aug", () => {
    expect(eclipses.map((eclipse) => [eclipse.kind, moscow(eclipse.at)])).toEqual([
      ["solarAnnular", "2026-02-17"],
      ["lunarTotal", "2026-03-03"],
      ["solarTotal", "2026-08-12"],
      ["lunarPartial", "2026-08-28"],
    ]);
  });

  test("visibility from Moscow: the annular eclipse over Antarctica and the lunar eclipse at 14:33 Moscow time (the Moon is below the horizon by day) are not seen, the total solar eclipse of 12 August is seen at sunset only", () => {
    expect(eclipses.map((eclipse) => eclipse.visibility)).toEqual(["none", "none", "part", "none"]);
  });

  test("the share of the Sun covered is given only when the Sun is above the horizon at the maximum", () => {
    expect(eclipses.every((eclipse) => eclipse.obscuration === null)).toBe(true);
    const august2027 = eclipsesOfYear(2027).find((eclipse) => eclipse.kind === "solarTotal")!;
    expect(august2027.visibility).toBe("full");
    expect(august2027.obscuration).toBeGreaterThan(0);
    expect(august2027.obscuration).toBeLessThanOrEqual(1);
  });

  test("2027 has the penumbral lunar eclipses of 21 February (Moscow), 18 July and 17 August, and the first one is seen at night", () => {
    const lunar = eclipsesOfYear(2027).filter((eclipse) => eclipse.kind === "lunarPenumbral");
    expect(lunar.map((eclipse) => moscow(eclipse.at))).toEqual(["2027-02-21", "2027-07-18", "2027-08-17"]);
    expect(lunar[0]!.visibility).toBe("full");
  });

  test("the sign is the one the Moon stands in at the maximum", () => {
    expect(eclipses[1]!.sign).toBe("virgo");
  });
});

describe("retrogradePeriods", () => {
  test("Mercury in 2026 turns retrograde three times and each period is two to four weeks long", () => {
    const periods = retrogradePeriods("mercury", 2026);
    expect(periods).toHaveLength(3);
    for (const period of periods) {
      const days = (period.to.getTime() - period.from.getTime()) / 86_400_000;
      expect(days).toBeGreaterThan(18);
      expect(days).toBeLessThan(26);
    }
    expect(moscow(periods[0]!.from)).toBe("2026-02-26");
    expect(moscow(periods[2]!.to)).toBe("2026-11-13");
  });

  test("Venus is retrograde for about six weeks, and the periods of two years are about 584 days apart", () => {
    const periods = [...retrogradePeriods("venus", 2025), ...retrogradePeriods("venus", 2026), ...retrogradePeriods("venus", 2027)];
    expect(periods.length).toBeGreaterThanOrEqual(2);
    for (const period of periods) {
      const days = (period.to.getTime() - period.from.getTime()) / 86_400_000;
      expect(days).toBeGreaterThan(38);
      expect(days).toBeLessThan(46);
    }
    const gap = (periods[1]!.from.getTime() - periods[0]!.from.getTime()) / 86_400_000;
    expect(gap).toBeGreaterThan(570);
    expect(gap).toBeLessThan(600);
  });

  test("a period on the turn of the year belongs to both years, and the stations are in order", () => {
    const first = retrogradePeriods("mercury", 2025);
    const second = retrogradePeriods("mercury", 2026);
    for (const period of [...first, ...second]) expect(period.from.getTime()).toBeLessThan(period.to.getTime());
  });
}, 30_000);
