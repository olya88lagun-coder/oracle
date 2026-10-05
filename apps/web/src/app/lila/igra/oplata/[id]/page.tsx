import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LilaPaymentWaiting } from "@/components/lila/LilaPaymentWaiting";
import { Scene } from "@/components/Scene";
import { purchaseViewDeps } from "@/server/payments-deps";
import { getLilaPurchaseView } from "@/server/payments-service";
import { requireUser } from "@/server/viewer";

export const metadata: Metadata = { title: "Оплата партии с проводником", robots: { index: false, follow: false } };

export default async function LilaPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const view = await getLilaPurchaseView(purchaseViewDeps(), { purchaseId: id, userId: user.id });
  if (!view) notFound();
  // Статус «готово» тоже отдаём странице ожидания: она засчитывает продажу в Метрике и сама открывает партию
  return (
    <Scene>
      <LilaPaymentWaiting purchaseId={view.id} initial={view.status} />
    </Scene>
  );
}
