import * as Astronomy from "astronomy-engine";
import { eclipticLongitude, isRetrograde } from "../natal/bodies";
import { signOf, type SignId } from "../natal/zodiac";
import { MOSCOW } from "./day";
import { moonSnapshot } from "./phase";

const MIN_MS = 60_000;
const DAY_MS = 86_400_000;
const OBSERVER = new Astronomy.Observer(MOSCOW.latitude, MOSCOW.longitude, 150);

const yearBounds = (year: number): [Date, Date] => {
  const offset = MOSCOW.utcOffsetMinutes * MIN_MS;
  return [new Date(Date.UTC(year, 0, 1) - offset), new Date(Date.UTC(year + 1, 0, 1) - offset)];
};

export type EclipseKind = "lunarTotal" | "lunarPartial" | "lunarPenumbral" | "solarTotal" | "solarAnnular" | "solarPartial" | "solarHybrid";
// full — максимум виден из Москвы (светило над горизонтом), part — над горизонтом только часть затмения, none — не видно
export type EclipseVisibility = "full" | "part" | "none";
export type YearEclipse = { kind: EclipseKind; at: Date; sign: SignId; visibility: EclipseVisibility; obscuration: number | null };

const LUNAR: Record<string, EclipseKind> = { [Astronomy.EclipseKind.Total]: "lunarTotal", [Astronomy.EclipseKind.Partial]: "lunarPartial", [Astronomy.EclipseKind.Penumbral]: "lunarPenumbral" };
const SOLAR: Record<string, EclipseKind> = { [Astronomy.EclipseKind.Total]: "solarTotal", [Astronomy.EclipseKind.Annular]: "solarAnnular", [Astronomy.EclipseKind.Partial]: "solarPartial" };

const visibilityOf = (peak: number, others: readonly number[]): EclipseVisibility => (peak > 0 ? "full" : others.some((altitude) => altitude > 0) ? "part" : "none");

function moonAltitude(at: Date): number {
  const time = Astronomy.MakeTime(at);
  const equator = Astronomy.Equator(Astronomy.Body.Moon, time, OBSERVER, true, true);
  return Astronomy.Horizon(time, OBSERVER, equator.ra, equator.dec, "normal").altitude;
}

// Видимость лунного затмения: Луна над горизонтом в максимум, в начало или в конец частной фазы (полутеневые — по полутеневой границе)
function lunarVisibility(peak: Date, halfDurationMinutes: number): EclipseVisibility {
  const half = halfDurationMinutes * MIN_MS;
  return visibilityOf(moonAltitude(peak), [moonAltitude(new Date(peak.getTime() - half)), moonAltitude(new Date(peak.getTime() + half))]);
}

// Видимость солнечного затмения: местное затмение ищем в сутки вокруг максимума; если для Москвы его нет — Солнце не над горизонтом.
// obscuration — наибольшая доля закрытого диска Солнца в Москве (0…1), только когда Солнце над горизонтом в максимум
function solarVisibility(peak: Date): { visibility: EclipseVisibility; obscuration: number | null } {
  const local = Astronomy.SearchLocalSolarEclipse(new Date(peak.getTime() - DAY_MS), OBSERVER);
  if (Math.abs(local.peak.time.date.getTime() - peak.getTime()) > DAY_MS) return { visibility: "none", obscuration: null };
  return { visibility: visibilityOf(local.peak.altitude, [local.partial_begin.altitude, local.partial_end.altitude]), obscuration: local.peak.altitude > 0 ? local.obscuration : null };
}

// Лунные и солнечные затмения календарного года (по Москве): тип, момент максимума, знак Луны, видимость из Москвы; по порядку времени
export function eclipsesOfYear(year: number): YearEclipse[] {
  const [start, end] = yearBounds(year);
  const found: YearEclipse[] = [];
  for (let lunar = Astronomy.SearchLunarEclipse(start); lunar.peak.date < end; lunar = Astronomy.NextLunarEclipse(lunar.peak)) {
    const half = lunar.kind === Astronomy.EclipseKind.Penumbral ? lunar.sd_penum : lunar.sd_partial;
    found.push({ kind: LUNAR[lunar.kind]!, at: lunar.peak.date, sign: moonSnapshot(lunar.peak.date).sign, visibility: lunarVisibility(lunar.peak.date, half), obscuration: null });
  }
  for (let solar = Astronomy.SearchGlobalSolarEclipse(start); solar.peak.date < end; solar = Astronomy.NextGlobalSolarEclipse(solar.peak)) {
    found.push({ kind: SOLAR[solar.kind] ?? "solarHybrid", at: solar.peak.date, sign: moonSnapshot(solar.peak.date).sign, ...solarVisibility(solar.peak.date) });
  }
  return found.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export type RetrogradePlanet = "mercury" | "venus";
// from — станция, с которой планета идёт в обратную сторону; to — станция, после которой снова идёт прямо; signFrom и signTo — знаки в эти моменты
export type RetrogradePeriod = { planet: RetrogradePlanet; from: Date; to: Date; signFrom: SignId; signTo: SignId };

// Момент смены направления между двумя проверками: делим пополам до минуты
function station(planet: RetrogradePlanet, before: Date, after: Date): Date {
  const was = isRetrograde(planet, before);
  let low = before.getTime();
  let high = after.getTime();
  while (high - low > MIN_MS) {
    const middle = Math.floor((low + high) / 2);
    if (isRetrograde(planet, new Date(middle)) === was) low = middle;
    else high = middle;
  }
  return new Date(high);
}

// Периоды обратного движения, которые пересекаются с календарным годом по Москве. Берём запас в 150 дней с каждой стороны, чтобы не потерять период на стыке лет
export function retrogradePeriods(planet: RetrogradePlanet, year: number): RetrogradePeriod[] {
  const [start, end] = yearBounds(year);
  const step = 6 * 3_600_000;
  const periods: RetrogradePeriod[] = [];
  let from: Date | null = null;
  let previous = new Date(start.getTime() - 150 * DAY_MS);
  let wasRetro = isRetrograde(planet, previous);
  for (let at = new Date(previous.getTime() + step); at.getTime() <= end.getTime() + 150 * DAY_MS; at = new Date(at.getTime() + step)) {
    const retro = isRetrograde(planet, at);
    if (retro !== wasRetro) {
      const moment = station(planet, previous, at);
      if (retro) from = moment;
      else if (from) {
        periods.push({ planet, from, to: moment, signFrom: signOf(eclipticLongitude(planet, from)).sign, signTo: signOf(eclipticLongitude(planet, moment)).sign });
        from = null;
      }
    }
    wasRetro = retro;
    previous = at;
  }
  return periods.filter((period) => period.to > start && period.from < end);
}
