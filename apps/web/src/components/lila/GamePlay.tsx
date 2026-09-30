"use client";

import { lilaCellByNumber } from "@oracle/content/lila";
import { LILA_CELL_COUNT } from "@oracle/core";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { lilaErrorMessage, type ApiResult, type GameApi } from "@/lib/lila-api";
import { lilaHistoryPath } from "@/lib/lila-paths";
import { describeTurn, openedCells, rollSummary, trailOf } from "@/lib/lila-turn";
import type { GameView } from "@/lib/lila-view";
import { Board } from "./Board";
import { DiceControls } from "./DiceControls";
import { Die } from "./Die";
import { MoveHistory } from "./MoveHistory";
import { TurnPanel } from "./TurnPanel";

type Props = { initial: GameView; api: GameApi; images: readonly string[]; onClosed: (game: GameView) => void };
type Tab = "turn" | "board" | "history";
const TABS: readonly { id: Tab; label: string }[] = [
  { id: "turn", label: "Ход" },
  { id: "board", label: "Поле" },
  { id: "history", label: "История" },
];

const GUIDE_POLL_MS = 3000;
// Дольше ждать абзац не стоит: блок «Проводник пишет…» исчезает без ошибки, партия идёт дальше
const GUIDE_WAIT_MS = 45_000;
// Кубик катится не меньше этого времени, даже если сервер ответил быстрее; при «уменьшить движение» бросок мгновенный.
// Первый бросок — «ритуал» и длиннее, дальше бросков много, поэтому короче
const FIRST_ROLL_ANIMATION_MS = 700;
const ROLL_ANIMATION_MS = 480;

export function GamePlay({ initial, api, images, onClosed }: Props) {
  const router = useRouter();
  const [game, setGame] = useState(initial);
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  const apiRef = useRef(api);
  apiRef.current = api;
  const [tab, setTab] = useState<Tab>("turn");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const [rolling, setRolling] = useState(false);

  async function run(action: () => Promise<ApiResult>, minMs = 0): Promise<boolean> {
    setBusy(true);
    setError(null);
    const started = Date.now();
    const result = await action();
    const rest = minMs - (Date.now() - started);
    if (rest > 0) await new Promise((resolve) => setTimeout(resolve, rest));
    setBusy(false);
    setRolling(false);
    if (!result.ok) {
      setError(lilaErrorMessage(result.error));
      return false;
    }
    setGame(result.game);
    return true;
  }

  // Своим кубиком игрок бросает сам, поэтому катится только кубик сайта
  const rollMs = game.movesCount === 0 ? FIRST_ROLL_ANIMATION_MS : ROLL_ANIMATION_MS;
  function roll(value?: number) {
    const animate = value === undefined && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate) setRolling(true);
    return run(() => api.roll(value), animate ? rollMs : 0);
  }

  const lastIndex = game.moves.length - 1;
  const turn = lastIndex >= 0 ? describeTurn(game, lastIndex, lilaCellByNumber) : null;
  const last = lastIndex >= 0 ? game.moves[lastIndex]! : null;

  // Абзацы пишет воркер уже после хода: пока у какого-то хода он не готов, перечитываем партию раз в три секунды
  const anyGuidePending = game.moves.some((move) => move.guidePending);
  useEffect(() => {
    setWaitedTooLong(false);
  }, [game.movesCount]);
  useEffect(() => {
    if (!anyGuidePending || waitedTooLong) return;
    const started = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - started > GUIDE_WAIT_MS) return setWaitedTooLong(true);
      const result = await apiRef.current.refresh();
      if (result.ok) setGame(result.game);
    }, GUIDE_POLL_MS);
    return () => clearInterval(timer);
  }, [anyGuidePending, waitedTooLong, game.movesCount]);

  async function finish() {
    setBusy(true);
    const result = await api.finish();
    setBusy(false);
    if (!result.ok) return setError(lilaErrorMessage(result.error));
    reachGoal("lila_finish");
    // У платной партии после завершения ждёт итог: он на странице партии в портрете
    if (result.game.mode === "guided") return router.push(lilaHistoryPath(result.game.id));
    onClosed(result.game);
  }

  return (
    <div className="stack lila-play">
      <header className="lila-play__bar">
        <p className="tag">Намерение: {game.intention}</p>
        <p>
          Ходов {game.movesCount} · Открыто клеток: {openedCells(game)} из {LILA_CELL_COUNT}
        </p>
      </header>
      <div className="row lila-tabs" role="tablist" aria-label="Разделы партии">
        {TABS.map(({ id, label }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className="lila-tabs__tab" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="lila-play__layout">
        <div className="stack lila-play__side" hidden={tab !== "turn"}>
          <TurnPanel
            turn={turn}
            moveNumber={game.movesCount}
            note={last?.note ?? null}
            images={images}
            editable={game.status === "active" && last !== null}
            onSaveNote={(note) => run(() => api.saveNote(game.movesCount, note))}
            guide={game.mode === "guided" && last ? { text: last.guideText, pending: last.guidePending, waitedTooLong } : null}
          />
          {game.canFinish && !confirming && (
            <button type="button" className={game.position === 68 ? "button button--lavender" : "button button--ghost"} onClick={() => setConfirming(true)}>
              Завершить партию
            </button>
          )}
          {confirming && (
            <div className="card stack" role="alertdialog" aria-label="Завершить партию">
              <p>После завершения ходить нельзя. История партии останется в портрете, у гостя — в браузере.</p>
              <div className="row">
                <button type="button" className="button button--lavender" disabled={busy} onClick={() => void finish()}>
                  Завершить партию
                </button>
                <button type="button" className="button button--ghost" onClick={() => setConfirming(false)}>
                  Продолжить партию
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Кубик над полем и виден на любой вкладке, кроме истории: бросок и движение фишки — на одном экране */}
        <div className="card lila-play__dice" hidden={tab === "history"}>
          <div className="lila-play__rollrow">
            <Die value={turn?.roll ?? null} rolling={rolling} moveKey={game.movesCount} rollMs={rollMs} />
            <p role="status" className="lila-play__roll">
              {rolling ? "" : turn ? rollSummary(turn) : "Бросьте кубик. Чтобы начать путь, нужна шестёрка."}
            </p>
          </div>
          {game.canRoll && <DiceControls busy={busy} onRoll={(value) => void roll(value)} />}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="card lila-play__board" hidden={tab === "history"}>
          <Board current={game.position} trail={trailOf(game)} variant="full" />
          <Board current={game.position} trail={trailOf(game)} variant="compact" />
        </div>
        <div className="lila-play__history" hidden={tab !== "history"}>
          <MoveHistory game={game} />
        </div>
      </div>
    </div>
  );
}
