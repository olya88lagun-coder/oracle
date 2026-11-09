"use client";

import { useRef, useState, type FormEvent } from "react";
import { reachNumerologyGoal } from "@/lib/numerology";
import { squareOutcome, type SquareOutcome } from "@/lib/pythagoras";
import { PythagorasResult, type SquareSummaries } from "./PythagorasResult";

export function PythagorasCalculator({ summaries, fatePages, pairHref }: { summaries: SquareSummaries; fatePages: readonly number[]; pairHref?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<SquareOutcome | null>(null);
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = squareOutcome(input.current?.value ?? "", new Date());
    setOutcome(next);
    if (next.ok) reachNumerologyGoal("pythagoras_calculated");
    else input.current?.focus();
  }
  const error = outcome && !outcome.ok ? outcome.error : "";
  return <>
    <section className="year-hero" aria-labelledby="square-title">
      <div className="year-hero__copy stack">
        <p className="eyebrow">Нумерология · психоматрица</p>
        <h1 className="display" id="square-title">Квадрат Пифагора <span>по дате рождения</span></h1>
        <p className="lead">Девять ячеек из цифр вашей даты рождения: какие качества звучат сильнее, а какие тише. Расчёт открытый, расшифровка — сразу и бесплатно.</p>
        <form className="year-form" onSubmit={calculate} noValidate>
          <div className="field"><label htmlFor="square-birth-date">Дата рождения</label>
            <input ref={input} id="square-birth-date" className="input" type="date" min="1900-01-01" required aria-invalid={Boolean(error)} aria-describedby={error ? "square-date-error square-privacy" : "square-privacy"} onChange={() => setOutcome(null)} />
          </div>
          <button className="button" type="submit">Построить квадрат</button>
          {error && <p id="square-date-error" className="error" role="alert">{error}</p>}
          <p className="muted" id="square-privacy">Бесплатно, без регистрации. Дата остаётся в браузере.</p>
        </form>
      </div>
      <div className="year-hero__art" aria-hidden="true"><span>3×3</span><p>девять ячеек<br />восемь линий</p></div>
    </section>
    {outcome?.ok && <PythagorasResult key={outcome.iso} iso={outcome.iso} square={outcome.square} summaries={summaries} fatePages={fatePages} pairHref={pairHref} />}
  </>;
}
