import { listReceiptsToSend, markReceiptSent } from "@oracle/db";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { formatRubles } from "@/lib/legal";
import { getDb } from "@/server/db";
import { requireOwner } from "@/server/owner";
import { PRODUCT_DESCRIPTIONS } from "@/server/payments-service";

export const metadata: Metadata = { title: "Чеки к отправке", robots: { index: false, follow: false } };
// Список меняется с каждой оплатой: страница собирается на каждый запрос
export const dynamic = "force-dynamic";

const PAID_AT = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Moscow" });

async function receiptSent(formData: FormData) {
  "use server";
  await requireOwner();
  const id = formData.get("id");
  if (typeof id === "string") await markReceiptSent(getDb(), id, new Date());
  revalidatePath("/admin/receipts");
}

export default async function ReceiptsPage() {
  await requireOwner();
  const receipts = await listReceiptsToSend(getDb());

  return (
    <main className="workspace receipts-page">
      <div className="matrix-wrap">
        <h1>Чеки к отправке</h1>
        <p className="receipts-lead">
          Оплаченные покупки, по которым чек ещё не отправлен. Название услуги и сумма — как для чека в «Мой налог». После отправки нажмите «Чек отправлен»: покупка уйдёт из
          списка, а почта покупателя сотрётся.
        </p>
        {receipts.length === 0 ? (
          <p className="receipts-empty" role="status">
            Все чеки отправлены.
          </p>
        ) : (
          <ul className="receipts">
            {receipts.map((receipt) => (
              <li key={receipt.id} className="receipt">
                <div>
                  <h2>{PRODUCT_DESCRIPTIONS[receipt.product]}</h2>
                  <p className="receipt__amount">{formatRubles(receipt.amountKopecks)}</p>
                </div>
                <dl className="receipt__details">
                  <dt>Почта</dt>
                  <dd>{receipt.email ?? "не указана или стёрта по просьбе покупателя"}</dd>
                  <dt>Оплачено</dt>
                  <dd>{receipt.paidAt ? PAID_AT.format(receipt.paidAt) : "—"}</dd>
                  <dt>Платёж ЮKassa</dt>
                  <dd>{receipt.paymentId ?? "—"}</dd>
                </dl>
                <form action={receiptSent}>
                  <input type="hidden" name="id" value={receipt.id} />
                  <button type="submit" className="quiet">
                    Чек отправлен
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
