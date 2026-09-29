"use client";

import { LILA_INTENTION_MAX_CHARS } from "@oracle/core";
import { useState } from "react";
import { LILA_THEMES } from "@/lib/lila-themes";

type Props = { busy: boolean; error: string | null; onStart: (intention: string) => void };

const MIN_CHARS = 3;

export function IntentionForm({ busy, error, onStart }: Props) {
  const [text, setText] = useState("");
  const ready = text.trim().length >= MIN_CHARS;
  return (
    <form
      className="card stack lila-setup"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) onStart(text);
      }}
    >
      <h2 id="intention-title">Какой вопрос вы хотите исследовать?</h2>
      <div className="row lila-setup__themes" role="group" aria-label="Готовые темы">
        {LILA_THEMES.map((theme) => (
          <button key={theme.label} type="button" className="chip" onClick={() => setText(theme.intention)}>
            {theme.label}
          </button>
        ))}
      </div>
      <label className="stack">
        <span>Или напишите своё намерение</span>
        <textarea className="input" rows={3} maxLength={LILA_INTENTION_MAX_CHARS} value={text} onChange={(event) => setText(event.target.value)} aria-describedby="intention-hint" />
        <span id="intention-hint" className="muted">
          {text.length} / {LILA_INTENTION_MAX_CHARS}. Лучше одно личное и конкретное: «Почему мне трудно принять решение о работе?»
        </span>
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button button--lavender" disabled={!ready || busy}>
        Играть
      </button>
    </form>
  );
}
