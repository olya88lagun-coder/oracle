import type { NatalSnapshot } from "@oracle/core";
import { buildBirthMoment } from "@/lib/natal-moment";
import { parseBirthPlaceBody } from "./profile-service";

// Тело покупки натального разбора: те же поля, что у сохранения места рождения, плюс обязательное время и выбор при «времени дважды».
// Проверка строгая, содержимое в сообщения и логи не попадает: возвращается снимок или null
export function parseNatalBirth(value: unknown, now: Date): { snapshot: NatalSnapshot } | null {
  const valid = parseBirthPlaceBody(value, now);
  if (!valid || valid.time === null) return null;
  const choice = (value as { zoneChoice?: unknown }).zoneChoice === "second" ? "second" : "first";
  const { place } = valid;
  const { moment } = buildBirthMoment({ date: valid.birthDate, time: valid.time, city: place }, choice);
  return { snapshot: { date: valid.birthDate, time: valid.time, instant: moment.instant.toISOString(), latitude: place.latitude, longitude: place.longitude, placeName: place.name } };
}
