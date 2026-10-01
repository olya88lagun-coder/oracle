"use client";

import { LILA_NOTE_MAX_CHARS } from "@oracle/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { lilaCellPath } from "@/lib/lila-paths";
import type { Turn } from "@/lib/lila-turn";
import { CellArt } from "./CellArt";

type Props = {
  turn: Turn | null;
  moveNumber: number;
  note: string | null;
  images: readonly string[];
  editable: boolean;
  onSaveNote: (note: string) => Promise<boolean>;
  // «стрела» или «змея» последнего хода — подпись у перехода; null, когда перехода не было
  transition?: "arrow" | "snake" | null;
  // Абзац проводника платной партии; null — партия без проводника
  guide?: { text: string | null; pending: boolean; waitedTooLong: boolean } | null;
};

export function TurnPanel({ turn, moveNumber, note, images, editable, onSaveNote, transition = null, guide = null }: Props) {
  const [draft, setDraft] = useState(note ?? "");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setDraft(note ?? "");
    setSaved(false);
  }, [moveNumber, note]);

  if (!turn)
    return (
      <section className="turn-panel turn-empty" aria-labelledby="turn-title">
        <h2 id="turn-title">Первый ход</h2>
        <p>Бросьте кубик. Чтобы начать путь, нужна шестёрка.</p>
      </section>
    );
  const { landed, arrival } = turn;
  const changed = draft !== (note ?? "");
  const status = saved && !changed ? "Сохранено." : draft.length > 0 ? `${draft.length} / ${LILA_NOTE_MAX_CHARS}` : `До ${LILA_NOTE_MAX_CHARS} символов`;
  return (
    <section className="turn-panel" aria-labelledby="turn-title">
      {turn.kind === "wait" || !landed ? (
        <div className="turn-empty">
          <h2 id="turn-title">Пауза</h2>
          <p>{turn.question}</p>
        </div>
      ) : (
        <>
          <div className="turn-art-heading">
            <CellArt cell={landed} available={images} priority />
            <div>
              <small>
                Клетка {landed.number}
                {turn.visit > 1 ? ` · визит ${turn.visit}` : ""}
              </small>
              <h2 id="turn-title">{landed.name}</h2>
            </div>
          </div>
          <p className="landed-about">{landed.about}</p>
          {arrival && (
            <>
              {turn.transitionText && <p className="transition-copy">{turn.transitionText}</p>}
              <Link className="turn-arrival" href={lilaCellPath(arrival)}>
                <CellArt cell={arrival} size="thumb" available={images} decorative />
                <span>
                  <small>
                    {transition === "snake" ? "Змея" : "Стрела"} · {landed.number} → {arrival.number}
                  </small>
                  <strong>{arrival.name}</strong>
                </span>
                <Icon name="arrow-up-right" size={18} />
              </Link>
            </>
          )}
          <div className="turn-question">
            <p>
              <span className="sr-only">Вопрос: </span>
              {turn.question}
            </p>
          </div>
          {turn.previousNote && (
            <div className="previous-note">
              <small>Запись с прошлого визита</small>
              <p>{turn.previousNote}</p>
            </div>
          )}
        </>
      )}
      {guide && (guide.text || (guide.pending && !guide.waitedTooLong)) && (
        <div className="turn-guide" aria-live="polite">
          <small>Проводник</small>
          {guide.text ? <p>{guide.text}</p> : <p role="status">Проводник пишет…</p>}
        </div>
      )}
      {editable && (
        <div className="note-form">
          <label htmlFor="move-note">Ваша запись — по желанию</label>
          <textarea
            id="move-note"
            rows={3}
            maxLength={LILA_NOTE_MAX_CHARS}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setSaved(false);
            }}
          />
          <div className="note-actions">
            <span role="status">{status}</span>
            {changed && (
              <button type="button" className="quiet" onClick={async () => setSaved(await onSaveNote(draft))}>
                <Icon name="save" />
                Сохранить
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
