import * as Astronomy from "astronomy-engine";
import { describe, expect, test } from "vitest";
import { eclipticLongitude } from "../natal/bodies";
import { signOf } from "../natal/zodiac";
import { moonSnapshot, nextMoonEvent, PHASES, phaseOf, previousNewMoon } from "./phase";

const minutes = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60_000;

// Эталон: timeanddate.com/moon/phases/russia/moscow?year=2026 (время по Москве, UTC+3), сверено 17.11.2026
const NEW_MOON_9_NOV = new Date("2026-11-09T07:02:00Z"); // 10:02
const FIRST_QUARTER_17_NOV = new Date("2026-11-17T11:47:00Z"); // 14:47
const FULL_MOON_24_NOV = new Date("2026-11-24T14:53:00Z"); // 17:53
const LAST_QUARTER_1_DEC = new Date("2026-12-01T06:08:00Z"); // 09:08

describe("phaseOf", () => {
  test("names the eight phases by sectors of 45° centred on 0°, 45°, …", () => {
    expect(phaseOf(0)).toBe("new");
    expect(phaseOf(359)).toBe("new");
    expect(phaseOf(22.4)).toBe("new");
    expect(phaseOf(22.5)).toBe("waxingCrescent");
    expect(phaseOf(90)).toBe("firstQuarter");
    expect(phaseOf(135)).toBe("waxingGibbous");
    expect(phaseOf(180)).toBe("full");
    expect(phaseOf(225)).toBe("waningGibbous");
    expect(phaseOf(270)).toBe("lastQuarter");
    expect(phaseOf(315)).toBe("waningCrescent");
    expect(PHASES).toHaveLength(8);
  });
});

describe("moonSnapshot", () => {
  test("is dark at the new moon and full at the full moon", () => {
    expect(moonSnapshot(NEW_MOON_9_NOV).illumination).toBeLessThan(0.01);
    expect(moonSnapshot(FULL_MOON_24_NOV).illumination).toBeGreaterThan(0.99);
  });

  test("is half lit with the right phase name at the quarters", () => {
    const first = moonSnapshot(FIRST_QUARTER_17_NOV);
    expect(first.illumination).toBeGreaterThan(0.48);
    expect(first.illumination).toBeLessThan(0.52);
    expect(first.phase).toBe("firstQuarter");
    expect(moonSnapshot(LAST_QUARTER_1_DEC).phase).toBe("lastQuarter");
  });

  test("waxes before the full moon and wanes after it", () => {
    expect(moonSnapshot(new Date(FULL_MOON_24_NOV.getTime() - 86_400_000)).waxing).toBe(true);
    expect(moonSnapshot(new Date(FULL_MOON_24_NOV.getTime() + 86_400_000)).waxing).toBe(false);
  });

  test("takes the sign from the same ecliptic longitude as the natal chart", () => {
    const at = new Date("2026-11-17T09:00:00Z");
    const longitude = eclipticLongitude("moon", at);
    const snapshot = moonSnapshot(at);
    expect(snapshot.sign).toBe(signOf(longitude).sign);
    expect(snapshot.signDegree).toBeCloseTo(signOf(longitude).degree, 6);
  });

  test("on 17 Nov 2026 at noon in Moscow the Moon is about 49 % lit and in Aquarius", () => {
    const snapshot = moonSnapshot(new Date("2026-11-17T09:00:00Z"));
    expect(snapshot.illumination).toBeGreaterThan(0.47);
    expect(snapshot.illumination).toBeLessThan(0.51);
    expect(snapshot.sign).toBe("aquarius");
  });
});

describe("moon events", () => {
  test("the next events after 17 Nov 2026 noon in Moscow match the reference to two minutes", () => {
    const start = new Date("2026-11-17T09:00:00Z");
    const first = nextMoonEvent(start);
    expect(first.kind).toBe("firstQuarter");
    expect(minutes(first.at, FIRST_QUARTER_17_NOV)).toBeLessThanOrEqual(2);
    const full = nextMoonEvent(first.at);
    expect(full.kind).toBe("full");
    expect(minutes(full.at, FULL_MOON_24_NOV)).toBeLessThanOrEqual(2);
    const last = nextMoonEvent(full.at);
    expect(last.kind).toBe("lastQuarter");
    expect(minutes(last.at, LAST_QUARTER_1_DEC)).toBeLessThanOrEqual(2);
    expect(nextMoonEvent(last.at).kind).toBe("new");
  });

  test("the next event is always strictly later than the moment asked from", () => {
    const at = FULL_MOON_24_NOV;
    expect(nextMoonEvent(at).at.getTime()).toBeGreaterThan(at.getTime());
  });

  test("the previous new moon is the last one not after the moment, less than a lunation back", () => {
    const at = new Date("2026-11-17T09:00:00Z");
    const previous = previousNewMoon(at);
    expect(minutes(previous, NEW_MOON_9_NOV)).toBeLessThanOrEqual(2);
    expect(at.getTime() - previous.getTime()).toBeLessThan(30 * 86_400_000);
    // Угол в момент новолуния может быть 359,99…: считаем расстояние до нуля по кругу
    const angle = Astronomy.MoonPhase(previous);
    expect(Math.min(angle, 360 - angle)).toBeLessThan(1);
  });
});
