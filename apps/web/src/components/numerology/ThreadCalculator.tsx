"use client";

import { useRef, useState, type FormEvent } from "react";
import { reachNumerologyGoal } from "@/lib/numerology";
import { localToday, threadOutcome, type ThreadOutcome, type ThreadTexts } from "@/lib/life-thread";
import { ThreadResult } from "./ThreadResult";

export function ThreadCalculator({ texts }: { texts: ThreadTexts }) {
  const input = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<ThreadOutcome | null>(null);
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = threadOutcome(input.current?.value ?? "", localToday(new Date()));
    setOutcome(next);
    if (next.ok) reachNumerologyGoal("thread_calculated");
    else input.current?.focus();
  }
  const error = outcome && !outcome.ok ? outcome.error : "";
  return <>
    <section className="thread-hero" aria-labelledby="thread-title">
      <div className="thread-hero__copy stack">
        <p className="eyebrow">График судьбы по дате рождения</p>
        <h1 className="display" id="thread-title">Вся жизнь — <span>одной нитью</span></h1>
        <p className="lead">Введите дату рождения: построим нить личных годов. Подъёмы, тихие годы и точка «вы здесь», с открытой формулой.</p>
        <form className="year-form" onSubmit={calculate} noValidate>
          <div className="field"><label htmlFor="thread-birth-date">Дата рождения</label>
            <input ref={input} id="thread-birth-date" className="input" type="date" min="1900-01-01" required aria-invalid={Boolean(error)} aria-describedby={error ? "thread-date-error thread-privacy" : "thread-privacy"} onChange={() => setOutcome(null)} />
          </div>
          <button className="button" type="submit">Показать мою нить</button>
          {error && <p id="thread-date-error" className="error" role="alert">{error}</p>}
          <p className="muted" id="thread-privacy">Бесплатно, без регистрации. Дата остаётся в браузере.</p>
        </form>
      </div>
    </section>
    {outcome?.ok && <ThreadResult key={outcome.iso} thread={outcome.thread} texts={texts} />}
  </>;
}
