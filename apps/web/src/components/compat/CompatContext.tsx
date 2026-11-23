"use client";

import { useState } from "react";
import { COMPAT_CONTEXT_FOOTNOTE, COMPAT_CONTEXT_TITLE, COMPAT_CONTEXTS, type CompatContextId } from "@/lib/compat-context";

// Контекст отношений: пара, друзья, коллеги, родные. Меняет только пояснение и вопросы для разговора; арифметика результата не затрагивается
export function CompatContext() {
  const [selected, setSelected] = useState<CompatContextId>("pair");
  const context = COMPAT_CONTEXTS.find((item) => item.id === selected) ?? COMPAT_CONTEXTS[0]!;
  return (
    <section className="card stack compat-context" aria-labelledby="compat-context-title">
      <h2 id="compat-context-title">{COMPAT_CONTEXT_TITLE}</h2>
      <div className="natal-choice-group" role="group" aria-label={COMPAT_CONTEXT_TITLE}>
        {COMPAT_CONTEXTS.map((item) => (
          <button key={item.id} type="button" className="natal-choice" aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <p className="compat-context__note">{context.note}</p>
      <h3>Вопросы для разговора</h3>
      <ul className="compat-context__questions">
        {context.questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
      <p className="muted">{COMPAT_CONTEXT_FOOTNOTE}</p>
    </section>
  );
}
