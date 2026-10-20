import { localToUtc, utcOffsetMinutes, type BirthMoment } from "@oracle/core/natal";
import type { NatalInput } from "./natal-input";

// Момент рождения для расчёта карты. Единственный модуль калькулятора со значением из @oracle/core/natal:
// интерфейс подгружает его динамически, после нажатия «Рассчитать карту», вместе с ядром.

// Нужны только дата, время и положение города: так момент можно собрать и на сервере из сохранённых данных
type MomentInput = Pick<NatalInput, "date" | "time"> & { city: Pick<NatalInput["city"], "zone" | "latitude" | "longitude"> };
export type ZoneChoice = "first" | "second";
export type ClockKind = "ok" | "gap" | "ambiguous";
export type BirthMomentResult = {
  moment: BirthMoment;
  clock: ClockKind; // gap — такого времени не было (часы перевели вперёд), ambiguous — было дважды (часы перевели назад)
  correctedTime: string | null; // ЧЧ:ММ — ближайшее существующее местное время; только при clock === "gap"
};

const NOON = "12:00";
const MINUTE_MS = 60_000;
const pad2 = (value: number) => String(value).padStart(2, "0");

function parseDate(date: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError("Дата должна быть в формате ГГГГ-ММ-ДД");
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function parseTime(time: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) throw new RangeError("Время должно быть в формате ЧЧ:ММ");
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

// Местные дата и время в часовом поясе города → момент в UTC.
// Неизвестное время — местный полдень. Время, которого не было (gap), сдвигается на ближайшее существующее;
// время, которое было дважды (ambiguous), берётся по выбору zoneChoice: «first» (по умолчанию) или «second».
// Модуль не читает текущие дату и часовой пояс устройства: результат зависит только от входа и базы часовых поясов.
export function buildBirthMoment(input: MomentInput, zoneChoice?: ZoneChoice): BirthMomentResult {
  const { zone, latitude, longitude } = input.city;
  const timeKnown = input.time !== null;
  const converted = localToUtc(zone, { ...parseDate(input.date), ...parseTime(input.time ?? NOON) });

  const instant = converted.kind === "ambiguous" && zoneChoice === "second" ? converted.alternative : converted.utc;
  const correctedTime = converted.kind === "gap" ? localClock(zone, converted.utc) : null;

  return {
    moment: { instant: new Date(instant.getTime()), latitude, longitude, timeKnown },
    clock: converted.kind,
    correctedTime,
  };
}

// Показание часов в зоне в момент instant, ЧЧ:ММ
function localClock(zone: string, instant: Date): string {
  const local = new Date(instant.getTime() + utcOffsetMinutes(zone, instant.getTime()) * MINUTE_MS);
  return `${pad2(local.getUTCHours())}:${pad2(local.getUTCMinutes())}`;
}
