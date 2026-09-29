import { LILA_SESSION_PRODUCT } from "@oracle/core";
import { getPaidWaitingLilaGame } from "@oracle/db";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GameShell } from "@/components/lila/GameShell";
import { Scene } from "@/components/Scene";
import { lilaPaymentPath } from "@/lib/lila-paths";
import { getDb } from "@/server/db";
import { availableCellImages } from "@/server/lila-images";
import { lilaDeps } from "@/server/lila-route";
import { activeGame } from "@/server/lila-service";
import { salesEnabled } from "@/server/payments-deps";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = { title: "Играть в Лилу", robots: { index: false, follow: false } };

export default async function LilaGamePage() {
  const user = await currentUser();
  const game = user ? await activeGame(lilaDeps(), { userId: user.id }) : null;
  // Оплаченная партия с проводником ждёт своей очереди: страница ожидания её запустит, когда нет другой активной
  if (user && !game) {
    const paidWaiting = await getPaidWaitingLilaGame(getDb(), user.id);
    if (paidWaiting?.purchaseId) redirect(lilaPaymentPath(paidWaiting.purchaseId));
  }
  return (
    <Scene>
      <div className="scene__intro stack">
        <p className="eyebrow eyebrow--line">Лила</p>
        <h1 className="display">Ваша партия</h1>
      </div>
      <GameShell initialGame={game} signedIn={user !== null} images={availableCellImages()} guidedEnabled={salesEnabled(LILA_SESSION_PRODUCT)} />
    </Scene>
  );
}
