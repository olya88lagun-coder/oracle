import { LILA_SESSION_PRODUCT } from "@oracle/core";
import { getPaidWaitingLilaGame } from "@oracle/db";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GameShell } from "@/components/lila/GameShell";
import { lilaPaymentPath } from "@/lib/lila-paths";
import { getDb } from "@/server/db";
import { availableCellImages } from "@/server/lila-images";
import { lilaDeps } from "@/server/lila-route";
import { activeGame } from "@/server/lila-service";
import { salesEnabled } from "@/server/payments-deps";
import { isOwnerUser } from "@/server/owner";
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
  // Заголовок страницы (один <h1>) выводит сам GameShell: у него три состояния — выбор намерения, партия и история
  return (
    <main className="workspace lila-page">
      <div className="matrix-wrap">
        <GameShell initialGame={game} signedIn={user !== null} images={availableCellImages()} guidedEnabled={salesEnabled(LILA_SESSION_PRODUCT)} ownerFree={user ? await isOwnerUser(user.id) : false} />
      </div>
    </main>
  );
}
