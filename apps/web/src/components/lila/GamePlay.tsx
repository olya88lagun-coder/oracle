"use client";

import { lilaCellByNumber } from "@oracle/content/lila";
import { LILA_CELL_COUNT } from "@oracle/core";
import { useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { lilaErrorMessage, type ApiResult, type GameApi } from "@/lib/lila-api";
import { describeTurn, openedCells, trailOf } from "@/lib/lila-turn";
import type { GameView } from "@/lib/lila-view";
import { Board } from "./Board";
import { DiceControls } from "./DiceControls";
import { MoveHistory } from "./MoveHistory";
import { TurnPanel } from "./TurnPanel";

type Props = { initial: GameView; api: GameApi; images: readonly string[]; onClosed: (game: GameView) => void };
type Tab = "turn" | "board" | "history";
const TABS: readonly { id: Tab; label: string }[] = [
  { id: "turn", label: "Ход" },
  { id: "board", label: "Поле" },
  { id: "history", label: "История" },
];

export function GamePlay({ initial, api, images, onClosed }: Props) {
  const [game, setGame] = useState(initial);
  const [tab, setTab] = useState<Tab>("turn");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function run(action: () => Promise<ApiResult>): Promise<boolean> {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      setError(lilaErrorMessage(result.error));
      return false;
    }
    setGame(result.game);
    return true;
  }

  const lastIndex = game.moves.length - 1;
  const turn = lastIndex >= 0 ? describeTurn(game, lastIndex, lilaCellByNumber) : null;
  const last = lastIndex >= 0 ? game.moves[lastIndex]! : null;

  async function finish() {
    setBusy(true);
    const result = await api.finish();
    setBusy(false);
    if (!result.ok) return setError(lilaErrorMessage(result.error));
    reachGoal("lila_finish");
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
          />
          {game.canRoll && <DiceControls busy={busy} onRoll={(value) => void run(() => api.roll(value))} />}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
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
        <div className="lila-play__board" hidden={tab === "history"}>
          <Board current={game.position} trail={trailOf(game)} variant="full" />
          <Board current={game.position} trail={trailOf(game)} variant="compact" />
        </div>
        <div hidden={tab !== "history"}>
          <MoveHistory game={game} />
        </div>
      </div>
    </div>
  );
}
