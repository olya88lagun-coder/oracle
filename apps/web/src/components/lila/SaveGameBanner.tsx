"use client";

import type { GuestGame } from "@/lib/lila-guest";

type Props = { guest: GuestGame; hasActive?: boolean; onSave: (replace: boolean) => void; onDiscard: () => void };

// Гостевая партия нашлась в браузере уже после входа: предлагаем перенести её в портрет, не перезаписывая без спроса
export function SaveGameBanner({ guest, hasActive = false, onSave, onDiscard }: Props) {
  return (
    <section className="card card--accent stack lila-save" aria-label="Партия в этом браузере">
      <p>
        В этом браузере есть партия: «{guest.intention}», ходов {guest.moves.length}.
        {hasActive && " В портрете уже идёт другая партия."}
      </p>
      <div className="row">
        {hasActive ? (
          <>
            <button type="button" className="button button--ghost" onClick={onDiscard}>
              Оставить партию из портрета
            </button>
            <button type="button" className="button button--lavender" onClick={() => onSave(true)}>
              Заменить партией из браузера
            </button>
          </>
        ) : (
          <>
            <button type="button" className="button button--lavender" onClick={() => onSave(false)}>
              Сохранить партию
            </button>
            <button type="button" className="button button--ghost" onClick={onDiscard}>
              Не сохранять
            </button>
          </>
        )}
      </div>
    </section>
  );
}
