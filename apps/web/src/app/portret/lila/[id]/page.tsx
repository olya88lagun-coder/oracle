import { LILA_CELL_COUNT, LILA_SESSION_PRODUCT } from "@oracle/core";
import { getLilaConclusion, getLilaGameForUser } from "@oracle/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Board } from "@/components/lila/Board";
import { ConclusionView } from "@/components/lila/ConclusionView";
import { ConclusionWaiting } from "@/components/lila/ConclusionWaiting";
import { LilaPdfLink } from "@/components/lila/LilaPdfLink";
import { MoveHistory } from "@/components/lila/MoveHistory";
import { DISCLAIMER } from "@/lib/legal";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import { movesLabel, openedCells, trailOf } from "@/lib/lila-turn";
import { toGameView } from "@/lib/lila-view";
import { getDb } from "@/server/db";
import { salesEnabled } from "@/server/payments-deps";
import { enqueueConclusion } from "@/server/queue";
import { requireUser } from "@/server/viewer";

export const metadata: Metadata = { title: "Партия Лилы", robots: { index: false, follow: false } };

export default async function LilaHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const record = await getLilaGameForUser(getDb(), (await params).id, user.id);
  // Чужая и несуществующая партия неотличимы; ожидающая оплаты и брошенная историей не считаются
  if (!record || (record.status !== "active" && record.status !== "finished")) notFound();
  const game = toGameView(record);
  const guidedFinished = record.mode === "guided" && record.status === "finished";
  const conclusion = guidedFinished ? await getLilaConclusion(getDb(), record.id) : null;
  const waiting = guidedFinished && !conclusion;
  // Тот же id задачи не создаёт дубль, если она уже стоит или выполнена
  if (waiting) await enqueueConclusion({ gameId: record.id });
  const freeFinished = record.mode !== "guided" && record.status === "finished" && salesEnabled(LILA_SESSION_PRODUCT);
  return (
    <main className="workspace lila-page">
      <div className="matrix-wrap">
        <header className="game-heading">
          <h1>Партия Лилы</h1>
          <Link className="text-link" href="/portret">
            Мой портрет
            <Icon name="arrow-up-right" />
          </Link>
        </header>
        <p className="game-intention">{game.intention}</p>
        <div className="game-meta">
          <span>{movesLabel(game.movesCount)}</span>
          <span>
            Открыто клеток · {openedCells(game)} / {LILA_CELL_COUNT}
          </span>
          <span>{record.mode === "guided" ? "С проводником" : "Без проводника"}</span>
          <span>{game.status === "active" ? "Партия идёт" : "Партия завершена"}</span>
        </div>
        {(conclusion || freeFinished || game.status === "active") && (
          <div className="history-actions">
            {conclusion && <LilaPdfLink gameId={record.id} />}
            {freeFinished && (
              <p className="finished-note">
                Итог партии и PDF — <Link href={LILA_GAME_PATH}>в игре с проводником</Link>.
              </p>
            )}
            {game.status === "active" && (
              <Link className="button button--lavender" href={LILA_GAME_PATH}>
                Продолжить партию
              </Link>
            )}
          </div>
        )}
        {conclusion && <ConclusionView chapters={conclusion.chapters} />}
        {waiting && <ConclusionWaiting gameId={record.id} />}
        <div className="history-board">
          <Board current={game.position} trail={trailOf(game)} variant="full" />
          <Board current={game.position} trail={trailOf(game)} variant="compact" />
        </div>
        <MoveHistory game={game} />
        <p className="disclaimer">{DISCLAIMER}</p>
      </div>
    </main>
  );
}
