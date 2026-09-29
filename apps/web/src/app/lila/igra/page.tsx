import type { Metadata } from "next";
import { GameShell } from "@/components/lila/GameShell";
import { Scene } from "@/components/Scene";
import { availableCellImages } from "@/server/lila-images";
import { lilaDeps } from "@/server/lila-route";
import { activeGame } from "@/server/lila-service";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = { title: "Играть в Лилу", robots: { index: false, follow: false } };

export default async function LilaGamePage() {
  const user = await currentUser();
  const game = user ? await activeGame(lilaDeps(), { userId: user.id }) : null;
  return (
    <Scene>
      <div className="scene__intro stack">
        <p className="eyebrow eyebrow--line">Лила</p>
        <h1 className="display">Ваша партия</h1>
      </div>
      <GameShell initialGame={game} signedIn={user !== null} images={availableCellImages()} />
    </Scene>
  );
}
