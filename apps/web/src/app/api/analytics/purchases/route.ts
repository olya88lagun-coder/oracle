import { claimPurchaseAnalytics } from "@oracle/db";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/server/db";
import { loginDeps } from "@/server/deps";
import { getEnv } from "@/server/env";
import { isSameOrigin, SESSION_COOKIE } from "@/server/http";
import { getCurrentUser } from "@/server/login-service";

const HEADERS = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request, getEnv().APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403, headers: HEADERS });
    const user = await getCurrentUser(loginDeps(), request.cookies.get(SESSION_COOKIE)?.value ?? null);
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: HEADERS });

    // Identity comes only from the session; database claims already exclude ineligible purchases.
    const claimed = await claimPurchaseAnalytics(getDb(), user.id);
    const events = claimed.map(({ transactionId, product, amountKopecks }) => ({ transactionId, product, amountKopecks }));
    return NextResponse.json({ ok: true, events }, { headers: HEADERS });
  } catch {
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500, headers: HEADERS });
  }
}
