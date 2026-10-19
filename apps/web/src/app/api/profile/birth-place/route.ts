import { NextResponse, type NextRequest } from "next/server";
import { loginDeps } from "@/server/deps";
import { isSameOrigin, SESSION_COOKIE } from "@/server/http";
import { saveBirthPlaceForSession, type SaveBirthPlaceOutcome } from "@/server/profile-service";
import { clientKeyFromHeaders, profileLimiter } from "@/server/rate-limit";

const STATUS: Record<Extract<SaveBirthPlaceOutcome, { ok: false }>["error"], number> = { unauthorized: 401, invalid: 400 };

// Дата, время и место рождения — персональные данные: не пишутся в лог, не попадают в сообщения об ошибках и не возвращаются в ответе
export async function POST(request: NextRequest) {
  const deps = loginDeps();
  if (!isSameOrigin(request, deps.env.APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  if (!profileLimiter.allow(clientKeyFromHeaders(request.headers))) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  const value: unknown = await request.json().catch(() => null);
  const outcome = await saveBirthPlaceForSession(deps, { sessionToken: request.cookies.get(SESSION_COOKIE)?.value ?? null, value });
  if (!outcome.ok) return NextResponse.json(outcome, { status: STATUS[outcome.error] });
  return NextResponse.json({ ok: true });
}
