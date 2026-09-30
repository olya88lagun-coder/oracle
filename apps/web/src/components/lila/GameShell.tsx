"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { guestApi, importGuestGame, lilaErrorMessage, serverApi, startServerGame } from "@/lib/lila-api";
import { clearGuestGame, guestStart, guestView, readGuestGame, writeGuestGame, type GuestGame } from "@/lib/lila-guest";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import type { GameView } from "@/lib/lila-view";
import { loginHref } from "@/lib/next-path";
import { GamePlay } from "./GamePlay";
import { IntentionForm } from "./IntentionForm";
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
      reachGoal("lila_start");
      setBusy(false);
      return;
    }
    const result = await startServerGame(intention);
    setBusy(false);
    if (!result.ok) return setError(lilaErrorMessage(result.error));
    reachGoal("lila_start");
    setGame(result.game);
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

  if (!ready) return <p role="status">Загружаем партию…</p>;

  const active = game && game.status === "active" ? game : null;
  if (!active) {
    return (
      <div className="stack">
        {game && (
          <p role="status" className="lead">
            Партия завершена. История — {signedIn ? "в «Моём портрете»" : "в этом браузере"}.
          </p>
        )}
        {/* Итог и PDF есть только у партии с проводником; предложение начать её — сразу ниже, в форме намерения */}
        {game && game.mode !== "guided" && guidedEnabled && <p className="muted">Итог партии и PDF — в игре с проводником.</p>}
        {signedIn && guest && !game && <SaveGameBanner guest={guest} onSave={(replace) => void save(replace)} onDiscard={discard} />}
        <IntentionForm busy={busy} error={error} onStart={(text) => void start(text)} guided={guidedEnabled ? { signedIn } : null} />
      </div>
    );
  }

  return (
    <div className="stack">
      {signedIn && guest && <SaveGameBanner guest={guest} hasActive onSave={(replace) => void save(replace)} onDiscard={discard} />}
      {!signedIn && (
        <div className="lila-guest-hint">
          <p className="muted">Партия хранится только в этом браузере. Через VK ID её можно сохранить в «Моём портрете».</p>
          <Link className="touch-link" href={loginHref(LILA_GAME_PATH)}>
            Войти и сохранить партию
          </Link>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <GamePlay key={active.id} initial={active} api={signedIn ? serverApi(active.id) : guestApi(storage())} images={images} onClosed={setGame} />
    </div>
  );
}
