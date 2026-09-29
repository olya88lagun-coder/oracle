import { getPurchase } from "@oracle/db";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/server/env";
import { isSameOrigin } from "@/server/http";
import { fakeGateway, paymentsDeps } from "@/server/payments-deps";
import { purchaseReturnPath, syncPayment } from "@/server/payments-service";

// Только локально и в сквозных тестах (PAYMENTS=fake вместе с DEV_LOGIN=1): заменяет страницу оплаты ЮKassa
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gateway = fakeGateway();
  const deps = paymentsDeps();
  if (!gateway || !deps) return new NextResponse(null, { status: 404 });
  if (!isSameOrigin(request, getEnv().APP_URL)) return new NextResponse(null, { status: 403 });
  const { id } = await params;
  const form = await request.formData();
  const outcome = form.get("outcome") === "succeeded" ? "succeeded" : "canceled";
  const payment = await gateway.getPayment(id);
  if (!payment?.purchaseId || !gateway.complete(id, outcome)) return new NextResponse(null, { status: 404 });
  await syncPayment(deps, id);
  const purchase = await getPurchase(deps.db, payment.purchaseId);
  return NextResponse.redirect(new URL(purchase ? purchaseReturnPath(purchase) : "/portret", getEnv().APP_URL), 303);
}
