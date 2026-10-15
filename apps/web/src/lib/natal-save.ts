import type { City } from "@oracle/geo";
import type { IntentStorage, SaveStatus } from "./matrix-save";
import type { NatalInput } from "./natal-input";

// Сохранение натальной карты в портрет. Чистые функции: хранилище и «сегодня» передаются параметрами.
// Из @oracle/geo — только тип City (иначе база городов попала бы в бандл страницы).
// Данные рождения не попадают ни в адрес, ни в localStorage: «Войти и сохранить» кладёт введённое в sessionStorage этой вкладки
// только на время перехода во VK ID и обратно, а при чтении запись сразу стирается.

export const NATAL_PENDING_KEY = "oracle-natal-pending";

export type SavedBirth = { date: string; time: string | null; place: { name: string; latitude: number; longitude: number; zone: string } | null };
export type NatalSaveState = "guest" | "offer" | "saving" | "saved" | "error";
export type BirthPlacePayload = { birthDate: string; time: string | null; name: string; latitude: number; longitude: number; zone: string };

// Те же границы, что проверяет сервер (server/profile-service.ts); сервер проверяет ещё и существование часового пояса
const MIN_DATE = "1900-01-01";
const MAX_NAME_LENGTH = 120;
const MAX_ZONE_LENGTH = 64;
const MAX_LATITUDE = 85;
const MAX_LONGITUDE = 180;
const COORDINATE_DECIMALS = 4; // ~11 м: сравнение «то же место» не должно зависеть от хвоста дробной части
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;
const ZONE_CHARS = /^[A-Za-z0-9_+\-/]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRealDate(value: string, today: Date): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const probe = new Date(Date.UTC(year, month - 1, day));
  const calendar = probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
  const pad = (n: number, width: number) => String(n).padStart(width, "0");
  const localToday = `${pad(today.getFullYear(), 4)}-${pad(today.getMonth() + 1, 2)}-${pad(today.getDate(), 2)}`;
  return calendar && value >= MIN_DATE && value <= localToday;
}

function isPlaceName(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && value.length >= 1 && value.length <= MAX_NAME_LENGTH && !CONTROL_CHARS.test(value);
}

const isCoordinate = (value: unknown, limit: number): value is number => typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;
const isZoneName = (value: unknown): value is string => typeof value === "string" && value.length >= 1 && value.length <= MAX_ZONE_LENGTH && ZONE_CHARS.test(value);

// Город, которого нет в базе: у сохранённого места есть только название, координаты и пояс
function placeToCity(place: { name: string; latitude: number; longitude: number; zone: string }): City {
  return { id: 0, name: place.name, region: "", country: "", latitude: place.latitude, longitude: place.longitude, zone: place.zone, population: 0 };
}

export function markNatalSaveIntent(storage: IntentStorage | null, input: NatalInput): void {
  try {
    const { name, latitude, longitude, zone } = input.city;
    storage?.setItem(NATAL_PENDING_KEY, JSON.stringify({ date: input.date, time: input.time, city: { name, latitude, longitude, zone } }));
  } catch {
    // без хранилища человек просто введёт данные ещё раз и нажмёт «Сохранить в портрет»
  }
}

// Читает и всегда стирает запись. Чужой, испорченный или неполный JSON — null, исключение наружу не выходит
export function takeNatalSaveIntent(storage: IntentStorage | null, today: Date = new Date()): NatalInput | null {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(NATAL_PENDING_KEY) ?? null;
  } catch {
    return null;
  }
  try {
    storage?.removeItem(NATAL_PENDING_KEY);
  } catch {
    // нечего стирать
  }
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.city)) return null;
    const { date, time, city } = parsed;
    if (typeof date !== "string" || !isRealDate(date, today)) return null;
    if (time !== null && !(typeof time === "string" && TIME_PATTERN.test(time))) return null;
    if (!isPlaceName(city.name) || !isCoordinate(city.latitude, MAX_LATITUDE) || !isCoordinate(city.longitude, MAX_LONGITUDE) || !isZoneName(city.zone)) return null;
    return { date, time, city: placeToCity({ name: city.name, latitude: city.latitude, longitude: city.longitude, zone: city.zone }) };
  } catch {
    return null;
  }
}

export function toBirthPlacePayload(input: NatalInput): BirthPlacePayload {
  const { name, latitude, longitude, zone } = input.city;
  return { birthDate: input.date, time: input.time, name, latitude, longitude, zone };
}

export function savedProfileToInput(profile: SavedBirth & { place: NonNullable<SavedBirth["place"]> }): NatalInput {
  return { date: profile.date, time: profile.time, city: placeToCity(profile.place) };
}

// То, что после успешного сохранения лежит в портрете
export function savedFromInput(input: NatalInput): SavedBirth {
  const { name, latitude, longitude, zone } = input.city;
  return { date: input.date, time: input.time, place: { name, latitude, longitude, zone } };
}

const round = (value: number) => Number(value.toFixed(COORDINATE_DECIMALS));

// Портрет уже хранит ровно эти данные: дата, время, название, округлённые координаты и пояс
export function sameBirth(saved: SavedBirth | null, input: NatalInput | null): boolean {
  if (!saved || !saved.place || !input) return false;
  const { place } = saved;
  return (
    saved.date === input.date &&
    saved.time === input.time &&
    place.name === input.city.name &&
    round(place.latitude) === round(input.city.latitude) &&
    round(place.longitude) === round(input.city.longitude) &&
    place.zone === input.city.zone
  );
}

// В портрете есть другие данные рождения (дата матрицы или карта): перед сохранением надо предупредить, что они заменятся
export function replacesOtherBirth(saved: SavedBirth | null, input: NatalInput | null): boolean {
  if (!saved || !input) return false;
  return !sameBirth(saved, input) && (saved.place !== null || saved.date !== input.date);
}

export function natalSaveState(p: { signedIn: boolean; saved: SavedBirth | null; input: NatalInput | null; status: SaveStatus }): NatalSaveState {
  if (p.status === "saving") return "saving";
  if (p.status === "error") return "error";
  if (!p.signedIn) return "guest";
  return sameBirth(p.saved, p.input) ? "saved" : "offer";
}
