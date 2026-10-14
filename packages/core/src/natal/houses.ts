import * as Astronomy from "astronomy-engine";
import { ascendantAndMidheaven } from "./angles";
import { normalizeDegrees } from "./zodiac";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const PLACIDUS_MAX_LATITUDE = 66; // у полярного круга (66,56°) у части точек эклиптики исчезают восход или заход
const MAX_ITERATIONS = 50;
const EPSILON_DEGREES = 1e-9;

export type HouseSystem = "placidus" | "porphyry";
// cusps[0] — начало 1-го дома (асцендент), cusps[3] — IC, cusps[6] — десцендент, cusps[9] — МС; градусы 0…360
export type Cusps = [number, number, number, number, number, number, number, number, number, number, number, number];
export type Houses = { system: HouseSystem; cusps: Cusps };

// Долгота точки эклиптики с заданным прямым восхождением
const longitudeOfRightAscension = (rightAscension: number, obliquity: number): number =>
  normalizeDegrees(Math.atan2(Math.sin(rightAscension * RAD), Math.cos(rightAscension * RAD) * Math.cos(obliquity)) * DEG);

const declinationOf = (longitude: number, obliquity: number): number => Math.asin(Math.sin(obliquity) * Math.sin(longitude * RAD)) * DEG;

// Плацидус делит суточную дугу тела по времени на три равные части. Для каждой куспиды ищем точку эклиптики, у которой
// положение в собственной дуге равно нужной доле; итерация сходится за 5–10 шагов до широты 66°.
// above=true — куспиды 11 и 12 (к востоку от меридиана, над горизонтом); false — 2 и 3 (после восхода, под горизонтом)
function placidusCusp(ramc: number, latitude: number, obliquity: number, startOffset: number, fraction: number, above: boolean): number {
  let rightAscension = normalizeDegrees(ramc + startOffset);
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const declination = declinationOf(longitudeOfRightAscension(rightAscension, obliquity), obliquity);
    const semiArc = Math.acos(-Math.tan(latitude * RAD) * Math.tan(declination * RAD)) * DEG; // дневная полудуга
    const next = normalizeDegrees(above ? ramc + semiArc * fraction : ramc + semiArc + (180 - semiArc) * fraction);
    const change = ((next - rightAscension + 540) % 360) - 180;
    rightAscension = next;
    if (Math.abs(change) < EPSILON_DEGREES) break;
  }
  return longitudeOfRightAscension(rightAscension, obliquity);
}

// Куспиды домов: Плацидус, а за широтой 66° — Порфирий (угол делится на три равные дуги эклиптики)
export function houseCusps(date: Date, latitude: number, longitude: number): Houses {
  const { ascendant, midheaven } = ascendantAndMidheaven(date, latitude, longitude);
  const time = Astronomy.MakeTime(date);
  const obliquity = Astronomy.e_tilt(time).tobl * RAD;
  const ramc = normalizeDegrees(Astronomy.SiderealTime(time) * 15 + longitude);
  const imumCoeli = normalizeDegrees(midheaven + 180);

  let system: HouseSystem = "placidus";
  let cusp11: number, cusp12: number, cusp2: number, cusp3: number;
  if (Math.abs(latitude) <= PLACIDUS_MAX_LATITUDE) {
    cusp11 = placidusCusp(ramc, latitude, obliquity, 30, 1 / 3, true);
    cusp12 = placidusCusp(ramc, latitude, obliquity, 60, 2 / 3, true);
    cusp2 = placidusCusp(ramc, latitude, obliquity, 120, 1 / 3, false);
    cusp3 = placidusCusp(ramc, latitude, obliquity, 150, 2 / 3, false);
  } else {
    system = "porphyry";
    const above = normalizeDegrees(ascendant - midheaven) / 3;
    const below = normalizeDegrees(imumCoeli - ascendant) / 3;
    cusp11 = normalizeDegrees(midheaven + above);
    cusp12 = normalizeDegrees(midheaven + above * 2);
    cusp2 = normalizeDegrees(ascendant + below);
    cusp3 = normalizeDegrees(ascendant + below * 2);
  }
  const opposite = (value: number) => normalizeDegrees(value + 180);
  return {
    system,
    cusps: [ascendant, cusp2, cusp3, imumCoeli, opposite(cusp11), opposite(cusp12), opposite(ascendant), opposite(cusp2), opposite(cusp3), midheaven, cusp11, cusp12],
  };
}

// Номер дома (1…12), в который попадает долгота
export function houseOf(longitude: number, houses: Houses): number {
  const value = normalizeDegrees(longitude);
  for (let i = 0; i < 12; i++) {
    const start = houses.cusps[i] as number;
    const span = normalizeDegrees((houses.cusps[(i + 1) % 12] as number) - start);
    if (normalizeDegrees(value - start) < span) return i + 1;
  }
  return 12;
}
