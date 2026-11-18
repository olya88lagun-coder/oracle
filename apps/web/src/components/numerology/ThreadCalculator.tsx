"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { sessionStore } from "@/lib/matrix-save";
import { reachNumerologyGoal } from "@/lib/numerology";
import { localToday, threadOutcome, type ThreadOutcome, type ThreadTexts } from "@/lib/life-thread";
import { takeThreadIntent } from "@/lib/thread-offer";
import { ThreadResult, type ThreadOffer } from "./ThreadResult";

export function ThreadCalculator({ texts, offer }: { texts: ThreadTexts; offer?: ThreadOffer }) {
  const input = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<ThreadOutcome | null>(null);
  // После входа через «Войти и купить разбор» возвращаем дату из sessionStorage вкладки и сразу строим нить; запись читается и стирается всегда
  useEffect(() => {
    const pending = takeThreadIntent(sessionStore());
    if (!pending || !offer?.signedIn || !input.current) return;
    const next = threadOutcome(pending, localToday(new Date()));
    if (!next.ok) return;
    input.current.value = pending;
    setOutcome(next);
    // Только один раз, после загрузки страницы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
    {outcome?.ok && <ThreadResult key={outcome.iso} thread={outcome.thread} texts={texts} iso={outcome.iso} offer={offer} />}
  </>;
}
