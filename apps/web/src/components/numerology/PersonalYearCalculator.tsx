"use client";

import { useRef, useState, type FormEvent } from "react";
import { personalYearOutcome, reachNumerologyGoal, type PersonalYearOutcome } from "@/lib/numerology";
import type { FateSummary } from "./FateResult";
import { PersonalYearResult } from "./PersonalYearResult";

export function PersonalYearCalculator({ summaries }: { summaries: Readonly<Record<number, FateSummary>> }) {
  const input = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<PersonalYearOutcome | null>(null);
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = personalYearOutcome(input.current?.value ?? "", new Date());
    setOutcome(next);
    if (next.ok) reachNumerologyGoal("personal_year_calculated");
    else input.current?.focus();
  }
  const error = outcome && !outcome.ok ? outcome.error : "";
  return <>
    <section className="year-hero" aria-labelledby="personal-year-title">
      <div className="year-hero__copy stack">
        <p className="eyebrow">Нумерология · 2027</p>
        <h1 className="display" id="personal-year-title">Личный год <span>2027</span></h1>
        <p className="lead">Какой по счёту год девятилетнего цикла начинается для вас в 2027 году? Узнайте по дню и месяцу рождения — с открытой формулой.</p>
        <form className="year-form" onSubmit={calculate} noValidate>
          <div className="field"><label htmlFor="personal-year-birth-date">Дата рождения</label>
            <input ref={input} id="personal-year-birth-date" className="input" type="date" min="1900-01-01" required aria-invalid={Boolean(error)} aria-describedby={error ? "personal-year-date-error personal-year-privacy" : "personal-year-privacy"} onChange={() => setOutcome(null)} />
          </div>
          <button className="button button--lavender" type="submit">Узнать личный год</button>
          {error && <p id="personal-year-date-error" className="error" role="alert">{error}</p>}
          <p className="muted" id="personal-year-privacy">Бесплатно, без регистрации. Дата остаётся в браузере.</p>
        </form>
      </div>
      <div className="year-hero__art" aria-hidden="true"><span>1–9</span><p>Девять лет —<br />один цикл</p></div>
    </section>
    {outcome?.ok && <PersonalYearResult key={outcome.iso} iso={outcome.iso} result={outcome.result} summary={summaries[outcome.result.value]} />}
  </>;
}
