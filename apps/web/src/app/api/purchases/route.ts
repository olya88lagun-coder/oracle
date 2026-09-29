import { LILA_SESSION_PRODUCT } from "@oracle/core";
import { NextResponse, type NextRequest } from "next/server";
import { loginDeps } from "@/server/deps";
import { isSameOrigin, SESSION_COOKIE } from "@/server/http";
import { getCurrentUser } from "@/server/login-service";
import { paymentsDeps, salesEnabled } from "@/server/payments-deps";
import { retryPurchase, startLilaPurchase, startPurchase, type StartPurchaseError } from "@/server/payments-service";
import { clientKeyFromHeaders, purchaseLimiter } from "@/server/rate-limit";

const STATUS: Record<StartPurchaseError, number> = {
  invalid_email: 400,
  invalid_intention: 400,
  not_found: 404,
  no_birth_date: 409,
  already_paid: 409,
  active_game: 409,
  payment_failed: 502,
};

// Тело: { email } — новая покупка даты из портрета, { retry: id } — «Попробовать снова» после отмены;
// { product: "lila_session", email, intention } — сессия Лилы с проводником (для повтора — { retry, product })
export async function POST(request: NextRequest) {
  // Продукт определяет, какой переключатель проверять, поэтому тело читается до проверки флага
  const body: unknown = await request.json().catch(() => null);
  const { email, retry, product, intention } =
    typeof body === "object" && body !== null ? (body as { email?: unknown; retry?: unknown; product?: unknown; intention?: unknown }) : {};
  const lila = product === LILA_SESSION_PRODUCT;
  const deps = paymentsDeps();
  if (!salesEnabled(lila ? LILA_SESSION_PRODUCT : undefined) || !deps) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const login = loginDeps();
  if (!isSameOrigin(request, login.env.APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  if (!purchaseLimiter.allow(clientKeyFromHeaders(request.headers))) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  const user = await getCurrentUser(login, request.cookies.get(SESSION_COOKIE)?.value ?? null);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const outcome =
    retry !== undefined
      ? await retryPurchase(deps, { userId: user.id, purchaseId: retry })
      : lila
        ? await startLilaPurchase(deps, { userId: user.id, email, intention })
        : await startPurchase(deps, { userId: user.id, email });
  if (!outcome.ok) return NextResponse.json(outcome, { status: STATUS[outcome.error] });
  return NextResponse.json(outcome);
}
