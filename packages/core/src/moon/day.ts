import * as Astronomy from "astronomy-engine";
import { localToUtc, utcOffsetMinutes } from "../natal/time";
import { previousNewMoon } from "./phase";

// Место наблюдателя: координаты и часовой пояс (IANA, например Asia/Novosibirsk). Фаза и знак Луны от места не зависят;
// от него зависят восход, заход, границы суток и номера лунных суток
export type Place = { latitude: number; longitude: number; zone: string };

// Москва по умолчанию: без выбора города все лунные страницы считаются по Москве. Сдвиг постоянный, летнего времени в России нет
// (eclipses.ts и year.ts читают utcOffsetMinutes)
export const MOSCOW = { latitude: 55.7558, longitude: 37.6173, zone: "Europe/Moscow", utcOffsetMinutes: 180 } as const;

const DAY_MS = 86_400_000;

// Начало суток по Москве (00:00 UTC+3) для момента `at`; границу суток считаем по Москве, а не по часовому поясу сервера
export function moscowDayStart(at: Date): Date {
  const offset = MOSCOW.utcOffsetMinutes * 60_000;
  return new Date(Math.floor((at.getTime() + offset) / DAY_MS) * DAY_MS - offset);
}

// Начало местных суток (00:00 в зоне места) для момента `at`; границу суток считаем по зоне, а не по часовому поясу сервера.
// В сутки перевода часов они длятся 23 или 25 часов
export function dayStart(at: Date, place: Place = MOSCOW): Date {
  const local = new Date(at.getTime() + utcOffsetMinutes(place.zone, at.getTime()) * 60_000);
  return localToUtc(place.zone, { year: local.getUTCFullYear(), month: local.getUTCMonth() + 1, day: local.getUTCDate(), hour: 0, minute: 0 }).utc;
}

// Все события восхода (+1) или захода (-1) Луны в окне [from, from + limitDays], по возрастанию
function moonEvents(direction: 1 | -1, from: Date, limitDays: number, place: Place): Date[] {
  const observer = new Astronomy.Observer(place.latitude, place.longitude, 0);
  const end = from.getTime() + limitDays * DAY_MS;
  const events: Date[] = [];
  let start = from;
  while (start.getTime() < end) {
    const found = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, direction, start, (end - start.getTime()) / DAY_MS);
    if (!found || found.date.getTime() > end) break;
    events.push(found.date);
    start = new Date(found.date.getTime() + 60_000);
  }
  return events;
}

export const moonRises = (from: Date, limitDays: number, place: Place = MOSCOW): Date[] => moonEvents(1, from, limitDays, place);
export const moonSets = (from: Date, limitDays: number, place: Place = MOSCOW): Date[] => moonEvents(-1, from, limitDays, place);

export type LunarDay = { number: number; startsAt: Date; endsAt: Date };

// Соглашение российских лунных календарей: 1-е сутки начинаются в момент новолуния, 2-е — с первого восхода Луны после него,
// и так далее; номер не больше 30. Восход, случившийся до новолуния, суток не начинает (17.11.2026 в 13:53 начинаются 9-е сутки)
export function lunarDayFromRises(at: Date, newMoon: Date, rises: readonly Date[]): LunarDay {
  const time = at.getTime();
  const risen = rises.filter((rise) => rise.getTime() > newMoon.getTime() && rise.getTime() <= time);
  const startsAt = risen[risen.length - 1] ?? newMoon;
  const endsAt = rises.find((rise) => rise.getTime() > time) ?? new Date(startsAt.getTime() + 25 * 3_600_000);
  return { number: Math.min(1 + risen.length, 30), startsAt, endsAt };
}

// Восходы берём на месяц вперёд от новолуния
export function lunarDay(at: Date, place: Place = MOSCOW): LunarDay {
  const newMoon = previousNewMoon(at);
  return lunarDayFromRises(at, newMoon, moonRises(newMoon, 32, place));
}
