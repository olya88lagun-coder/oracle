import * as Astronomy from "astronomy-engine";
import { normalizeDegrees } from "./zodiac";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

// Асцендент и МС (середина неба) для момента UTC и географических координат (долгота на восток положительна)
export function ascendantAndMidheaven(date: Date, latitude: number, longitude: number): { ascendant: number; midheaven: number } {
  const time = Astronomy.MakeTime(date);
  const obliquity = Astronomy.e_tilt(time).tobl * RAD;
  const ramc = normalizeDegrees(Astronomy.SiderealTime(time) * 15 + longitude) * RAD;
  const ascendant = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(obliquity) + Math.tan(latitude * RAD) * Math.sin(obliquity))) * DEG;
  const midheaven = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(obliquity)) * DEG;
  return { ascendant: normalizeDegrees(ascendant), midheaven: normalizeDegrees(midheaven) };
}
