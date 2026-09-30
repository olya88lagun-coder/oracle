import { LILA_SESSION_PRODUCT } from "@oracle/core";
import { getPurchase } from "@oracle/db";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/server/db";
import { loginDeps } from "@/server/deps";
import { SESSION_COOKIE } from "@/server/http";
import { getCurrentUser } from "@/server/login-service";
import { purchaseViewDeps } from "@/server/payments-deps";
import { getLilaPurchaseView, getPurchaseView } from "@/server/payments-service";

// Страница ожидания спрашивает статус раз в несколько секунд; ответ — только владельцу покупки
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(loginDeps(), request.cookies.get(SESSION_COOKIE)?.value ?? null);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const purchase = await getPurchase(getDb(), id);
  if (purchase?.product === LILA_SESSION_PRODUCT) {
    const lilaView = await getLilaPurchaseView(purchaseViewDeps(), { purchaseId: id, userId: user.id });
    if (!lilaView) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, status: lilaView.status, gameId: lilaView.gameId }, { headers: { "cache-control": "no-store" } });
  }
  const view = await getPurchaseView(purchaseViewDeps(), { purchaseId: id, userId: user.id });
  if (!view) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, status: view.status, duplicateOf: view.duplicateOf }, { headers: { "cache-control": "no-store" } });
}
