import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fakeGateway } from "@/server/payments-deps";

export const metadata: Metadata = { title: "Тестовая оплата", robots: { index: false, follow: false } };

const KOPECKS = 100;

export default async function FakePaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const gateway = fakeGateway();
  const { id } = await params;
  const payment = gateway ? await gateway.getPayment(id) : null;
  if (!payment) notFound();

  return (
    <main className="page stack">
      <p className="eyebrow">Тестовая оплата — только для разработки</p>
      <h1 className="display">{payment.amountKopecks / KOPECKS} ₽</h1>
      <p className="lead">Настоящие деньги не списываются. Выберите, чем закончится оплата.</p>
      <div className="row">
        <form action={`/api/dev/pay/${id}`} method="post">
          <input type="hidden" name="outcome" value="succeeded" />
          <button type="submit" className="button">
            Оплатить
          </button>
        </form>
        <form action={`/api/dev/pay/${id}`} method="post">
          <input type="hidden" name="outcome" value="canceled" />
          <button type="submit" className="button button--ghost">
            Отменить
          </button>
        </form>
      </div>
    </main>
  );
}
