"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { reachGoal } from "@/lib/analytics";
import { guestApi, importGuestGame, lilaErrorMessage, serverApi, startServerGame } from "@/lib/lila-api";
import { clearGuestGame, guestStart, guestView, readGuestGame, writeGuestGame, type GuestGame } from "@/lib/lila-guest";
import { LILA_GAME_PATH, LILA_PATH } from "@/lib/lila-paths";
import { movesLabel, openedCells } from "@/lib/lila-turn";
import type { GameView } from "@/lib/lila-view";
import { loginHref } from "@/lib/next-path";
import { GamePlay } from "./GamePlay";
import { IntentionForm } from "./IntentionForm";
import { MoveHistory } from "./MoveHistory";
import { SaveGameBanner } from "./SaveGameBanner";

type Props = { initialGame: GameView | null; signedIn: boolean; images: string[]; guidedEnabled?: boolean };

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export function GameShell({ initialGame, signedIn, images, guidedEnabled = false }: Props) {
  const [game, setGame] = useState<GameView | null>(initialGame);
  const [guest, setGuest] = useState<GuestGame | null>(null);
  const [ready, setReady] = useState(signedIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Завершённая партия показывается историей, пока игрок не нажмёт «Новая партия»
  const [newGame, setNewGame] = useState(false);

  // Гостевая партия читается только в браузере; вошедшему она предлагается к переносу
  useEffect(() => {
    const saved = readGuestGame(storage());
    setGuest(saved);
    if (!signedIn && saved) setGame(guestView(saved));
    setReady(true);
  }, [signedIn]);

  async function start(intention: string) {
    setBusy(true);
    setError(null);
    if (!signedIn) {
      const next = guestStart(intention.replace(/\s+/g, " ").trim());
      writeGuestGame(storage(), next);
      setGuest(next);
      setGame(guestView(next));
      setNewGame(false);
      reachGoal("lila_start");
      setBusy(false);
      return;
    }
    const result = await startServerGame(intention);
    setBusy(false);
    if (!result.ok) return setError(lilaErrorMessage(result.error));
    reachGoal("lila_start");
    setGame(result.game);
    setNewGame(false);
  }

  async function save(replace: boolean) {
    if (!guest) return;
    setError(null);
    const result = await importGuestGame(guest, replace);
    if (!result.ok) return setError(lilaErrorMessage(result.error));
    clearGuestGame(storage());
    setGuest(null);
    setGame(result.game);
    reachGoal("lila_save");
  }

  const discard = () => {
    clearGuestGame(storage());
    setGuest(null);
  };

  if (!ready) {
    return (
      <div className="lila-loading">
        <h1>Лила</h1>
        <p role="status">Загружаем партию…</p>
      </div>
    );
  }

  const active = game && game.status === "active" ? game : null;
  if (!active && game && !newGame) {
    return (
      <div className="lila-play">
        <header className="game-heading">
          <h1>Партия завершена</h1>
          <Link className="text-link" href={LILA_PATH}>
            О Лиле
            <Icon name="arrow-up-right" />
          </Link>
        </header>
        <p className="game-intention">{game.intention}</p>
        <div className="game-meta">
          <span>{movesLabel(game.movesCount)}</span>
          <span>Открыто клеток · {openedCells(game)} / 72</span>
          <span>{game.mode === "guided" ? "С проводником" : "Без проводника"}</span>
        </div>
        <div className="finished-history">
          <MoveHistory game={game} />
        </div>
        {/* Итог и PDF есть только у партии с проводником; предложение начать её — в форме намерения после «Новой партии» */}
        {game.mode !== "guided" && guidedEnabled && <p className="finished-note">Итог партии и PDF — в игре с проводником.</p>}
        <div className="game-ending">
          <p role="status">
            История партии сохранена {signedIn ? <>в <Link href="/portret">«Моём портрете»</Link></> : "в этом браузере"}.
          </p>
          <button type="button" className="quiet" onClick={() => setNewGame(true)}>
            <Icon name="plus" />
            Новая партия
          </button>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="game-start-layout">
        <section className="game-start-copy">
          <h1>Лила</h1>
          <p>Игра с намерением на поле из 72 клеток — повод посмотреть на свой вопрос по-новому.</p>
          <Image className="start-art" src="/lila/board-base.webp" alt="Поле игры Лила" width={1920} height={1720} unoptimized />
        </section>
        <div>
          {signedIn && guest && !game && <SaveGameBanner guest={guest} onSave={(replace) => void save(replace)} onDiscard={discard} />}
          <IntentionForm busy={busy} error={error} onStart={(text) => void start(text)} guided={guidedEnabled ? { signedIn } : null} guest={!signedIn} />
        </div>
      </div>
    );
  }

  const notice = signedIn ? (
    guest ? <SaveGameBanner guest={guest} hasActive onSave={(replace) => void save(replace)} onDiscard={discard} /> : null
  ) : (
    <div className="guest-save">
      <p>Партия хранится только в этом браузере. Через VK ID её можно сохранить в «Моём портрете».</p>
      <Link href={loginHref(LILA_GAME_PATH)}>
        <Icon name="log-in" />
        Войти и сохранить партию
      </Link>
    </div>
  );

  return <GamePlay key={active.id} initial={active} api={signedIn ? serverApi(active.id) : guestApi(storage())} images={images} onClosed={setGame} notice={notice} />;
}
