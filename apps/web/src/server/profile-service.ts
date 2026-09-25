import { parseBirthDate, toIsoDate, type BirthDate } from "@oracle/core";
import { getBirthDate, saveBirthDate, type Database } from "@oracle/db";
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

export async function loadPortrait(deps: Pick<ProfileDeps, "db" | "now">, userId: string): Promise<{ birthDate: BirthDate | null }> {
  const stored = await getBirthDate(deps.db, userId);
  return { birthDate: stored ? parseBirthDate(stored, deps.now()) : null };
}
