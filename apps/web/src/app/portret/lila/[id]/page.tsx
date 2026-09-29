import { getLilaGameForUser } from "@oracle/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Board } from "@/components/lila/Board";
import { MoveHistory } from "@/components/lila/MoveHistory";
import { Scene } from "@/components/Scene";
import { DISCLAIMER } from "@/lib/legal";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import { trailOf } from "@/lib/lila-turn";
import { toGameView } from "@/lib/lila-view";
import { getDb } from "@/server/db";
import { requireUser } from "@/server/viewer";

export const metadata: Metadata = { title: "Партия Лилы", robots: { index: false, follow: false } };

export default async function LilaHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const record = await getLilaGameForUser(getDb(), (await params).id, user.id);
  // Чужая и несуществующая партия неотличимы; ожидающая оплаты и брошенная историей не считаются
  if (!record || (record.status !== "active" && record.status !== "finished")) notFound();
  const game = toGameView(record);
  return (
    <Scene>
      <div className="scene__intro stack">
        <p className="eyebrow eyebrow--line">Партия Лилы</p>
        <h1 className="display">{game.intention}</h1>
        <p className="muted">
          Ходов {game.movesCount} · {game.status === "active" ? "партия идёт" : "партия завершена"}
        </p>
        {game.status === "active" && (
          <p>
            <Link className="button button--lavender" href={LILA_GAME_PATH}>
              Продолжить партию
            </Link>
          </p>
        )}
      </div>
      <Board current={game.position} trail={trailOf(game)} variant="full" />
      <Board current={game.position} trail={trailOf(game)} variant="compact" />
      <section className="card stack" aria-labelledby="moves">
        <h2 id="moves">Ходы</h2>
        <MoveHistory game={game} />
      </section>
      <p className="muted">{DISCLAIMER}</p>
    </Scene>
  );
}
