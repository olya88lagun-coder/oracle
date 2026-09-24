import { NextResponse, type NextRequest } from "next/server";
import { withLoginMark } from "../lib/login-mark";
import type { AppEnv } from "./env";
import { CONSENT_COOKIE, consentCookieOptions, expiredCookieOptions, SESSION_COOKIE, sessionCookieOptions } from "./http";
import type { LoginCookies, LoginOutcome } from "./login-service";

export function readLoginCookies(request: NextRequest): LoginCookies {
  return { consent: request.cookies.get(CONSENT_COOKIE)?.value ?? null };
}

export function loginResponse(env: AppEnv, outcome: LoginOutcome): NextResponse {
  if (!outcome.ok) {
    console.warn("login failed", outcome.error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(outcome.error)}`, env.APP_URL), 303);
  }
  const response = NextResponse.redirect(new URL(withLoginMark(outcome.redirectTo), env.APP_URL), 303);
  response.cookies.set(SESSION_COOKIE, outcome.sessionToken, sessionCookieOptions(env.APP_URL));
  response.cookies.set(CONSENT_COOKIE, "", expiredCookieOptions(consentCookieOptions(env.APP_URL)));
  return response;
}
