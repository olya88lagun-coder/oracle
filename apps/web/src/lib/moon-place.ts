import type { Place } from "@oracle/core/moon";
import type { City } from "@oracle/geo";

// Город, выбранный человеком для лунных страниц. Хранится только в его браузере (localStorage), на сервер не уходит.
// Без выбора все лунные страницы считаются «по Москве»
export const PLACE_KEY = "moon:place:v1";

export type MoonPlace = { id: number; name: string; region: string; latitude: number; longitude: number; zone: string };
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;

export const placeFromCity = (city: City): MoonPlace => ({ id: city.id, name: city.name, region: city.region, latitude: city.latitude, longitude: city.longitude, zone: city.zone });

export const toPlace = (place: MoonPlace): Place => ({ latitude: place.latitude, longitude: place.longitude, zone: place.zone });

// Часовой пояс, который браузер не знает (старый браузер или испорченная запись), считаем ошибкой записи
function knownZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("ru-RU", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export function parsePlace(raw: string | null): MoonPlace | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { id, name, region, latitude, longitude, zone } = value as Record<string, unknown>;
  if (typeof id !== "number" || !Number.isInteger(id)) return null;
  if (typeof name !== "string" || name.trim() === "" || typeof region !== "string") return null;
  if (typeof latitude !== "number" || !Number.isFinite(latitude) || Math.abs(latitude) > 90) return null;
  if (typeof longitude !== "number" || !Number.isFinite(longitude) || Math.abs(longitude) > 180) return null;
  if (typeof zone !== "string" || zone === "" || !knownZone(zone)) return null;
  return { id, name, region, latitude, longitude, zone };
}

export const placeLabel = (place: MoonPlace | null): string => place?.name ?? "Москва";

// Стабильный ключ для кеша расчётов: у Москвы по умолчанию своего города нет
export const placeKey = (place: MoonPlace | null): string => (place ? String(place.id) : "moscow");

// Пересчитанное значение годится, только если оно посчитано для выбранного сейчас места (устаревший ответ не показываем)
export function localFor<T>(place: MoonPlace | null, live: { key: string; value: T } | null): T | null {
  return place && live && live.key === placeKey(place) ? live.value : null;
}

// Что делать с городом, выбранным в списке: Москва сбрасывает выбор (данные сервера и так московские), город с часовым поясом,
// который браузер не знает, не сохраняем (расчёт для него не заработает), остальные сохраняем
export type PlaceChoice = { kind: "reset" } | { kind: "invalid" } | { kind: "place"; place: MoonPlace };
const MOSCOW_GEONAMES_ID = 524901;

export function placeChoice(city: City): PlaceChoice {
  if (city.id === MOSCOW_GEONAMES_ID || (city.zone === "Europe/Moscow" && city.name === "Москва")) return { kind: "reset" };
  if (!knownZone(city.zone)) return { kind: "invalid" };
  return { kind: "place", place: placeFromCity(city) };
}
