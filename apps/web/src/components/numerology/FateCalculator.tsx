"use client";

import { useRef, useState, type FormEvent } from "react";
import { fateOutcome, reachNumerologyGoal, type FateOutcome } from "@/lib/numerology";
import { FateResult, type FateSummary } from "./FateResult";

// summaries — только принятые числа; полные тексты в браузер не попадают
export function FateCalculator({ summaries }: { summaries: Readonly<Record<number, FateSummary>> }) {
  const input = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<FateOutcome | null>(null);
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = fateOutcome(input.current?.value ?? "", new Date());
    setOutcome(next);
    if (next.ok) reachNumerologyGoal("numerology_calculated");
    else input.current?.focus();
  }
  const error = outcome && !outcome.ok ? outcome.error : "";
  return <>
    <section className="year-hero" aria-labelledby="numerology-title">
      <div className="year-hero__copy stack">
        <p className="eyebrow">Нумерология · по дате рождения</p>
        <h1 className="display" id="numerology-title">Число судьбы <span>по дате рождения</span></h1>
        <p className="lead">Одна цифра из вашей даты рождения — и тема, к которой можно примерить свой опыт. Расчёт открытый: видно каждое сложение.</p>
        <form className="year-form" onSubmit={calculate} noValidate>
          <div className="field"><label htmlFor="fate-birth-date">Дата рождения</label>
            <input ref={input} id="fate-birth-date" className="input" type="date" min="1900-01-01" required aria-invalid={Boolean(error)} aria-describedby={error ? "fate-date-error fate-privacy" : "fate-privacy"} onChange={() => setOutcome(null)} />
          </div>
          <button className="button" type="submit">Узнать число судьбы</button>
          {error && <p id="fate-date-error" className="error" role="alert">{error}</p>}
          <p className="muted" id="fate-privacy">Бесплатно, без регистрации. Дата остаётся в браузере.</p>
        </form>
      </div>
      <div className="year-hero__art" aria-hidden="true"><span>1–9</span><p>11 · 22 · 33<br />мастер-числа</p></div>
    </section>
    {outcome?.ok && <FateResult key={outcome.iso} iso={outcome.iso} result={outcome.result} summary={summaries[outcome.result.value]} />}
  </>;
}
