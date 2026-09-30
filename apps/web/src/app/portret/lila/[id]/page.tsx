import { LILA_SESSION_PRODUCT } from "@oracle/core";
import { getLilaConclusion, getLilaGameForUser } from "@oracle/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Board } from "@/components/lila/Board";
import { ConclusionView } from "@/components/lila/ConclusionView";
import { ConclusionWaiting } from "@/components/lila/ConclusionWaiting";
import { LilaPdfLink } from "@/components/lila/LilaPdfLink";
import { MoveHistory } from "@/components/lila/MoveHistory";
import { Scene } from "@/components/Scene";
import { DISCLAIMER } from "@/lib/legal";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import { describeGameFacts, trailOf } from "@/lib/lila-turn";
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
  return (
    <Scene>
      <div className="scene__intro stack">
        <p className="eyebrow eyebrow--line">Партия Лилы{record.mode === "guided" && <span className="tag">с проводником</span>}</p>
        <h1 className="display">{game.intention}</h1>
        <p className="muted">
          {describeGameFacts(game)} · {game.status === "active" ? "партия идёт" : "партия завершена"}
        </p>
        {conclusion && (
          <p>
            <LilaPdfLink gameId={record.id} />
          </p>
        )}
        {record.mode !== "guided" && record.status === "finished" && salesEnabled(LILA_SESSION_PRODUCT) && (
          <p className="muted">
            Итог партии и PDF —{" "}
            <Link href={LILA_GAME_PATH}>
              в игре с проводником
            </Link>
            .
          </p>
        )}
        {game.status === "active" && (
          <p>
            <Link className="button button--lavender" href={LILA_GAME_PATH}>
              Продолжить партию
            </Link>
          </p>
        )}
      </div>
      {conclusion && (
        <>
          <ConclusionView chapters={conclusion.chapters} />
        </>
      )}
      {waiting && <ConclusionWaiting gameId={record.id} />}
      <div className="card lila-play__board">
        <Board current={game.position} trail={trailOf(game)} variant="full" />
        <Board current={game.position} trail={trailOf(game)} variant="compact" />
      </div>
      <section className="card stack" aria-labelledby="moves">
        <h2 id="moves">Ходы</h2>
        <MoveHistory game={game} />
      </section>
      <p className="muted">{DISCLAIMER}</p>
    </Scene>
  );
}
