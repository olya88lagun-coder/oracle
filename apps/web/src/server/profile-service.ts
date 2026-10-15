import { parseBirthDate, toIsoDate, type BirthDate } from "@oracle/core";
import { isValidZone } from "@oracle/core/natal";
import { getBirthProfile, saveBirthDate, saveBirthPlace, type BirthPlace, type Database } from "@oracle/db";
import type { AppEnv } from "./env";
import { getCurrentUser } from "./login-service";

export type ProfileDeps = { db: Database; env: AppEnv; now: () => Date };
export type SaveBirthDateOutcome = { ok: true; birthDate: BirthDate } | { ok: false; error: "unauthorized" | "invalid_date" };

export async function saveBirthDateForSession(deps: ProfileDeps, p: { sessionToken: string | null; value: unknown }): Promise<SaveBirthDateOutcome> {
  const user = await getCurrentUser(deps, p.sessionToken);
  if (!user) return { ok: false, error: "unauthorized" };
  const birthDate = parseBirthDate(p.value, deps.now());
  if (!birthDate) return { ok: false, error: "invalid_date" };
  await saveBirthDate(deps.db, user.id, toIsoDate(birthDate), deps.now());
  return { ok: true, birthDate };
}

export type SaveBirthPlaceOutcome = { ok: true } | { ok: false; error: "unauthorized" | "invalid" };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
// Символы управления (в том числе перевод строки) в названии места не нужны и опасны для вывода и логов
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;
const IANA_ZONE_CHARS = /^[A-Za-z0-9_+\-/]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_ZONE_LENGTH = 64;
const MAX_LATITUDE = 85;
const MAX_LONGITUDE = 180;

type ValidBirthPlace = { birthDate: string; time: string | null; place: BirthPlace };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePlaceName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= MAX_NAME_LENGTH && !CONTROL_CHARS.test(name) ? name : null;
}

function parseCoordinate(value: unknown, limit: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

function parseZone(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_ZONE_LENGTH) return null;
  return IANA_ZONE_CHARS.test(value) && isValidZone(value) ? value : null;
}

// Лишние ключи тела игнорируются; значение любого другого типа — «invalid». Содержимое в ответ и в сообщения не попадает
export function parseBirthPlaceBody(value: unknown, now: Date): ValidBirthPlace | null {
  if (!isRecord(value)) return null;
  const date = typeof value.birthDate === "string" ? parseBirthDate(value.birthDate, now) : null;
  const time = value.time === null ? null : typeof value.time === "string" && TIME_PATTERN.test(value.time) ? value.time : undefined;
  const name = parsePlaceName(value.name);
  const latitude = parseCoordinate(value.latitude, MAX_LATITUDE);
  const longitude = parseCoordinate(value.longitude, MAX_LONGITUDE);
  const zone = parseZone(value.zone);
  if (!date || time === undefined || name === null || latitude === null || longitude === null || zone === null) return null;
  return { birthDate: toIsoDate(date), time, place: { name, latitude, longitude, zone } };
}

export async function saveBirthPlaceForSession(deps: ProfileDeps, p: { sessionToken: string | null; value: unknown }): Promise<SaveBirthPlaceOutcome> {
  const user = await getCurrentUser(deps, p.sessionToken);
  if (!user) return { ok: false, error: "unauthorized" };
  const valid = parseBirthPlaceBody(p.value, deps.now());
  if (!valid) return { ok: false, error: "invalid" };
  await saveBirthPlace(deps.db, user.id, valid, deps.now());
  return { ok: true };
}

export type Portrait = { birthDate: BirthDate | null; time: string | null; place: BirthPlace | null };

export async function loadPortrait(deps: Pick<ProfileDeps, "db" | "now">, userId: string): Promise<Portrait> {
  const stored = await getBirthProfile(deps.db, userId);
  if (!stored) return { birthDate: null, time: null, place: null };
  return { birthDate: parseBirthDate(stored.birthDate, deps.now()), time: stored.time, place: stored.place };
}
