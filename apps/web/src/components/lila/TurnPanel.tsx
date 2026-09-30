"use client";

import { LILA_NOTE_MAX_CHARS } from "@oracle/core";
import { useEffect, useState } from "react";
import type { Turn } from "@/lib/lila-turn";
import { CellArt } from "./CellArt";

type Props = {
  turn: Turn | null;
  moveNumber: number;
  note: string | null;
  images: readonly string[];
  editable: boolean;
  onSaveNote: (note: string) => Promise<boolean>;
  // Абзац проводника платной партии; null — партия без проводника
  guide?: { text: string | null; pending: boolean; waitedTooLong: boolean } | null;
};

export function TurnPanel({ turn, moveNumber, note, images, editable, onSaveNote, guide = null }: Props) {
  const [draft, setDraft] = useState(note ?? "");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setDraft(note ?? "");
    setSaved(false);
  }, [moveNumber, note]);

  if (!turn) return <p className="lead">Бросьте кубик. Чтобы начать путь, нужна шестёрка.</p>;
  const finalCell = turn.arrival ?? turn.landed;
  return (
    <section className="card stack lila-turn" aria-labelledby="turn-title">
      <p className="eyebrow">
        Ход {moveNumber} · выпало {turn.roll}
        {turn.visit > 1 && ` · вы здесь уже были (${turn.visit}-й раз)`}
      </p>
      {turn.kind === "wait" || !finalCell ? (
        <>
          <h2 id="turn-title">Пауза</h2>
          <p className="lead">{turn.question}</p>
        </>
      ) : (
        <>
          {turn.arrival && turn.landed && (
            <>
              <p className="eyebrow">
                Клетка {turn.landed.number} · «{turn.landed.name}»
              </p>
              <p>{turn.landed.about}</p>
              {turn.transitionText && <p className="lila-turn__transition">{turn.transitionText}</p>}
            </>
          )}
          <div className="lila-turn__cell">
            <CellArt cell={finalCell} available={images} priority />
            <div className="stack">
              <p className="eyebrow">Клетка {finalCell.number}</p>
              <h2 id="turn-title">{finalCell.name}</h2>
            </div>
          </div>
          {!turn.arrival && <p>{finalCell.about}</p>}
          <p className="lila-turn__question">
            <strong>Вопрос:</strong> {turn.question}
          </p>
          {turn.previousNote && <p className="muted">Ваша прошлая запись здесь: «{turn.previousNote}»</p>}
        </>
      )}
      {guide && (guide.text || (guide.pending && !guide.waitedTooLong)) && (
        <div className="lila-turn__guide" aria-live="polite">
          <p className="eyebrow">Проводник</p>
          {guide.text ? <p>{guide.text}</p> : <p role="status">Проводник пишет…</p>}
        </div>
      )}
      {editable && (
        <label className="stack">
          <span>Записать мысль (по желанию)</span>
          <textarea
            className="input"
            rows={3}
            maxLength={LILA_NOTE_MAX_CHARS}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setSaved(false);
            }}
          />
          <span className="row">
            <button type="button" className="button button--ghost" disabled={draft === (note ?? "")} onClick={async () => setSaved(await onSaveNote(draft))}>
              Сохранить
            </button>
            {saved && <span role="status">Сохранено.</span>}
          </span>
        </label>
      )}
    </section>
  );
}
