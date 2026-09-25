import { NextResponse, type NextRequest } from "next/server";
import { loginDeps } from "@/server/deps";
import { isSameOrigin, SESSION_COOKIE } from "@/server/http";
import { saveBirthDateForSession, type SaveBirthDateOutcome } from "@/server/profile-service";
import { clientKeyFromHeaders, profileLimiter } from "@/server/rate-limit";

const STATUS: Record<Extract<SaveBirthDateOutcome, { ok: false }>["error"], number> = { unauthorized: 401, invalid_date: 400 };

export async function POST(request: NextRequest) {
  const deps = loginDeps();
  if (!isSameOrigin(request, deps.env.APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  if (!profileLimiter.allow(clientKeyFromHeaders(request.headers))) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  const body: unknown = await request.json().catch(() => null);
  const value = typeof body === "object" && body !== null ? (body as { birthDate?: unknown }).birthDate : undefined;
  const outcome = await saveBirthDateForSession(deps, { sessionToken: request.cookies.get(SESSION_COOKIE)?.value ?? null, value });
  if (!outcome.ok) return NextResponse.json(outcome, { status: STATUS[outcome.error] });
  return NextResponse.json(outcome);
}
