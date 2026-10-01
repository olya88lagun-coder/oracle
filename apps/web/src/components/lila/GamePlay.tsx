"use client";

import { lilaCellByNumber } from "@oracle/content/lila";
import { LILA_CELL_COUNT } from "@oracle/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { reachGoal } from "@/lib/analytics";
import { lilaErrorMessage, type ApiResult, type GameApi } from "@/lib/lila-api";
import { LILA_PATH, lilaHistoryPath } from "@/lib/lila-paths";
import { describeTurn, movesLabel, openedCells, rollSummary, trailOf } from "@/lib/lila-turn";
import type { GameView } from "@/lib/lila-view";
import { Board } from "./Board";
import { BoardZoom } from "./BoardZoom";
import { DiceControls } from "./DiceControls";
import { Die } from "./Die";
import { MoveHistory } from "./MoveHistory";
import { TurnPanel } from "./TurnPanel";

// notice — полоса над вкладками: предложение сохранить гостевую партию или выбор при конфликте партий
type Props = { initial: GameView; api: GameApi; images: readonly string[]; onClosed: (game: GameView) => void; notice?: ReactNode };
type Tab = "turn" | "board" | "history";
const TABS: readonly { id: Tab; label: string; icon: "message-circle" | "grid-3x3" | "list" }[] = [
  { id: "turn", label: "Ход", icon: "message-circle" },
  { id: "board", label: "Поле", icon: "grid-3x3" },
  { id: "history", label: "История", icon: "list" },
];

const GUIDE_POLL_MS = 3000;
// Дольше ждать абзац не стоит: блок «Проводник пишет…» исчезает без ошибки, партия идёт дальше
const GUIDE_WAIT_MS = 45_000;
// Кубик катится не меньше этого времени, даже если сервер ответил быстрее; при «уменьшить движение» бросок мгновенный.
// Первый бросок — «ритуал» и длиннее, дальше бросков много, поэтому короче
const FIRST_ROLL_ANIMATION_MS = 700;
const ROLL_ANIMATION_MS = 480;
const GOAL_CELL = 68;

export function GamePlay({ initial, api, images, onClosed, notice = null }: Props) {
  const router = useRouter();
  const [game, setGame] = useState(initial);
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  const apiRef = useRef(api);
  apiRef.current = api;
  const [tab, setTab] = useState<Tab>("turn");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const confirmDialog = useRef<HTMLDialogElement>(null);

  const [rolling, setRolling] = useState(false);

  // Подтверждение завершения — настоящее модальное окно: фокус внутри, Esc закрывает
  useEffect(() => {
    const node = confirmDialog.current;
    if (!node) return;
    if (confirming && !node.open) node.showModal();
    if (!confirming && node.open) node.close();
  }, [confirming]);

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

  // Стрелки, Home и End переключают вкладки, как в обычном списке вкладок
  function moveTab(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = TABS.findIndex((item) => item.id === tab);
    const step = event.key === "ArrowRight" ? 1 : TABS.length - 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (index + step) % TABS.length;
    const target = TABS[next]!.id;
    setTab(target);
    document.getElementById(`tab-${target}`)?.focus({ preventScroll: true });
  }

  async function finish() {
    setBusy(true);
    const result = await api.finish();
    setBusy(false);
    if (!result.ok) {
      setConfirming(false);
      return setError(lilaErrorMessage(result.error));
    }
    reachGoal("lila_finish");
    // У платной партии после завершения ждёт итог: он на странице партии в портрете
    if (result.game.mode === "guided") return router.push(lilaHistoryPath(result.game.id));
    onClosed(result.game);
  }

  return (
    <div className="lila-play">
      <header className="game-heading">
        <h1>Ваша партия</h1>
        <Link className="text-link" href={LILA_PATH}>
          О Лиле
          <Icon name="arrow-up-right" />
        </Link>
      </header>
      <p className="game-intention">{game.intention}</p>
      <div className="game-meta">
        <span>{movesLabel(game.movesCount)}</span>
        <span>
          Открыто клеток · {openedCells(game)} / {LILA_CELL_COUNT}
        </span>
        <span>{game.mode === "guided" ? "С проводником" : "Без проводника"}</span>
      </div>
      {notice}
      <div className="game-tabs" role="tablist" aria-label="Разделы партии" onKeyDown={moveTab}>
        {TABS.map(({ id, label, icon }) => (
          <button key={id} type="button" role="tab" id={`tab-${id}`} aria-controls="game-panel" aria-selected={tab === id} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>
            <Icon name={icon} />
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div id="game-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="play-layout" data-tab={tab}>
        {/* Кубик над полем и виден на любой вкладке, кроме истории: бросок и движение фишки — на одном экране */}
        <div className="play-dice" hidden={tab === "history"}>
          <DiceControls
            die={<Die value={turn?.roll ?? null} rolling={rolling} moveKey={game.movesCount} rollMs={rollMs} />}
            caption={turn ? rollSummary(turn) : "Чтобы войти, нужна шестёрка."}
            canRoll={game.canRoll}
            busy={busy}
            rolling={rolling}
            onRoll={(value) => void roll(value)}
          />
        </div>
        <div className="play-side" hidden={tab !== "turn"}>
          <TurnPanel
            turn={turn}
            moveNumber={game.movesCount}
            note={last?.note ?? null}
            images={images}
            editable={game.status === "active" && last !== null}
            onSaveNote={(note) => run(() => api.saveNote(game.movesCount, note))}
            transition={last && last.transition !== "none" ? last.transition : null}
            guide={game.mode === "guided" && last ? { text: last.guideText, pending: last.guidePending, waitedTooLong } : null}
          />
        </div>
        <div className="play-board" hidden={tab === "history"}>
          <Board current={game.position} trail={trailOf(game)} variant="full" legend={false} />
          <Board current={game.position} trail={trailOf(game)} variant="compact" legend={false} />
          <div className="board-tools">
            <span>Цель игры · {GOAL_CELL}</span>
            <BoardZoom current={game.position} trail={trailOf(game)} />
          </div>
        </div>
        <div className="play-history" hidden={tab !== "history"}>
          <MoveHistory game={game} />
        </div>
      </div>
      <div className="game-ending">
        <p>Это символический способ посмотреть на свой вопрос, а не предсказание.</p>
        {game.canFinish && (
          <button type="button" className={game.position === GOAL_CELL ? "button button--lavender" : "quiet"} onClick={() => setConfirming(true)}>
            <Icon name="check" />
            Завершить партию
          </button>
        )}
      </div>
      <dialog ref={confirmDialog} className="confirm-dialog" role="alertdialog" aria-labelledby="finish-title" onClose={() => setConfirming(false)}>
        <h2 id="finish-title">Завершить партию?</h2>
        <p>После завершения ходить нельзя. История партии останется в портрете, у гостя — в браузере.</p>
        <div className="dialog-actions">
          <button type="button" className="quiet" onClick={() => setConfirming(false)}>
            Продолжить партию
          </button>
          <button type="button" className="button button--lavender" disabled={busy} onClick={() => void finish()}>
            Завершить партию
          </button>
        </div>
      </dialog>
    </div>
  );
}
