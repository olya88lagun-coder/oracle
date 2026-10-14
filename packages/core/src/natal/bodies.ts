import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./zodiac";

export const BODIES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const;
export type BodyId = (typeof BODIES)[number];

const ASTRONOMY_BODY: Record<Exclude<BodyId, "sun" | "moon">, Astronomy.Body> = {
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

// Видимая геоцентрическая эклиптическая долгота, градусы 0…360.
// Не использовать Astronomy.EclipticLongitude: она гелиоцентрическая (у Марса разница около 30°).
export function eclipticLongitude(body: BodyId, date: Date): number {
  const time = Astronomy.MakeTime(date);
  if (body === "sun") return normalizeDegrees(Astronomy.SunPosition(time).elon);
  if (body === "moon") return normalizeDegrees(Astronomy.EclipticGeoMoon(time).lon);
  return normalizeDegrees(Astronomy.Ecliptic(Astronomy.GeoVector(ASTRONOMY_BODY[body], time, true)).elon);
}

// Обратное движение: долгота за сутки уменьшается. У Солнца и Луны его нет.
export function isRetrograde(body: BodyId, date: Date): boolean {
  if (body === "sun" || body === "moon") return false;
  const halfDay = 12 * 3_600_000;
  let delta = eclipticLongitude(body, new Date(date.getTime() + halfDay)) - eclipticLongitude(body, new Date(date.getTime() - halfDay));
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta < 0;
}

// Средний восходящий узел Луны (формула Мееуса). Южный узел — на 180° от него.
export function meanLunarNode(date: Date): number {
  const centuries = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86_400_000 / 36_525;
  return normalizeDegrees(125.04452 - 1934.136261 * centuries);
}
