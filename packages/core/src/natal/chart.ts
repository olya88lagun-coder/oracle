import { ascendantAndMidheaven } from "./angles";
import { findAspects, type Aspect } from "./aspects";
import { BODIES, eclipticLongitude, isRetrograde, meanLunarNode, type BodyId } from "./bodies";
import { houseCusps, houseOf, type Houses } from "./houses";
import { signOf, type SignId } from "./zodiac";

export type BirthMoment = {
  instant: Date; // момент рождения в UTC; если время неизвестно — местный полдень
  latitude: number;
  longitude: number; // на восток положительна
  timeKnown: boolean;
};

export type ChartPoint = {
  id: BodyId | "northNode";
  longitude: number;
  sign: SignId;
  degree: number;
  retrograde: boolean;
  house: number | null;
};
export type ChartAngle = { longitude: number; sign: SignId; degree: number };

export type NatalChart = {
  points: ChartPoint[];
  ascendant: ChartAngle | null; // без времени рождения асцендента, МС и домов нет
  midheaven: ChartAngle | null;
  houses: Houses | null; // система (Плацидус или Порфирий) и куспиды; без времени рождения — null
  aspects: Aspect[];
  uncertainSigns: BodyId[]; // без времени: тела, которые в течение суток меняют знак
  timeKnown: boolean; // передан в BirthMoment; без времени рождения Луна на полдень неточна, поэтому аспекты с Луной не считаются
};

const HALF_DAY_MS = 12 * 3_600_000;
const MAX_LATITUDE = 85;

function placement(longitude: number): { sign: SignId; degree: number } {
  const { sign, degree } = signOf(longitude);
  return { sign, degree };
}

export function computeNatalChart(moment: BirthMoment): NatalChart {
  const { instant, latitude, longitude, timeKnown } = moment;
  if (Number.isNaN(instant.getTime())) throw new RangeError("Некорректный момент рождения");
  if (!(Math.abs(latitude) <= MAX_LATITUDE) || !(Math.abs(longitude) <= 180)) throw new RangeError("Некорректные координаты");

  const angles = timeKnown ? ascendantAndMidheaven(instant, latitude, longitude) : null;
  const longitudes = Object.fromEntries(BODIES.map((body) => [body, eclipticLongitude(body, instant)])) as Record<BodyId, number>;
  const houses = timeKnown ? houseCusps(instant, latitude, longitude) : null;
  const houseFor = (value: number) => (houses ? houseOf(value, houses) : null);

  const points: ChartPoint[] = BODIES.map((body) => ({
    id: body,
    longitude: longitudes[body],
    ...placement(longitudes[body]),
    retrograde: isRetrograde(body, instant),
    house: houseFor(longitudes[body]),
  }));
  const node = meanLunarNode(instant);
  points.push({ id: "northNode", longitude: node, ...placement(node), retrograde: true, house: houseFor(node) });

  const signAt = (body: BodyId, shiftMs: number) => signOf(eclipticLongitude(body, new Date(instant.getTime() + shiftMs))).sign;
  const uncertainSigns = timeKnown ? [] : BODIES.filter((body) => signAt(body, -HALF_DAY_MS) !== signAt(body, HALF_DAY_MS));

  const aspectBodies = timeKnown ? BODIES : BODIES.filter((body) => body !== "moon");

  return {
    points,
    ascendant: angles ? { longitude: angles.ascendant, ...placement(angles.ascendant) } : null,
    midheaven: angles ? { longitude: angles.midheaven, ...placement(angles.midheaven) } : null,
    houses,
    aspects: findAspects(longitudes, aspectBodies),
    uncertainSigns,
    timeKnown,
  };
}
