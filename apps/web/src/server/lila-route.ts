import type { UserRecord } from "@oracle/db";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "./db";
import { loginDeps } from "./deps";
import { getEnv } from "./env";
import { isSameOrigin, SESSION_COOKIE } from "./http";
import { defaultRandomRoll, type LilaDeps, type LilaError, type LilaResult } from "./lila-service";
import { getCurrentUser } from "./login-service";
import { enqueueConclusion, enqueueGuideMove } from "./queue";
import { lilaLimiter } from "./rate-limit";

const STATUS: Record<LilaError, number> = { invalid: 400, not_found: 404, not_active: 409, limit: 409, at_goal: 409, too_early: 409, active_exists: 409 };

export const lilaDeps = (): LilaDeps => ({ db: getDb(), randomRoll: defaultRandomRoll, now: () => new Date(), enqueueGuide: enqueueGuideMove, enqueueConclusion });

const NO_STORE = { "cache-control": "no-store" };

export const lilaResponse = (result: LilaResult): NextResponse =>
  result.ok ? NextResponse.json(result, { headers: NO_STORE }) : NextResponse.json(result, { status: STATUS[result.error], headers: NO_STORE });

// Самое большое законное тело — перенос партии: 120 записей по 500 знаков в UTF-8 и служебные поля
export const LILA_MAX_BODY_BYTES = 256 * 1024;

type PostHandler = (p: { user: UserRecord; body: Record<string, unknown>; deps: LilaDeps }) => Promise<NextResponse>;

export async function lilaUser(request: NextRequest): Promise<UserRecord | null> {
  return getCurrentUser(loginDeps(), request.cookies.get(SESSION_COOKIE)?.value ?? null);
}

// Общая проверка всех POST-маршрутов партий: тот же сайт, вход, лимит запросов, тело — объект JSON
export async function lilaPost(request: NextRequest, handler: PostHandler): Promise<NextResponse> {
  if (!isSameOrigin(request, getEnv().APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  const user = await lilaUser(request);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  // Ключ — только пользователь: адрес из заголовка клиент может менять, лимит не должен от него зависеть
  if (!lilaLimiter.allow(user.id)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  if (Number(request.headers.get("content-length") ?? 0) > LILA_MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
  const text = await request.text().catch(() => "");
  if (text.length > LILA_MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
  const raw: unknown = (() => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  })();
  const body = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return handler({ user, body, deps: lilaDeps() });
}
