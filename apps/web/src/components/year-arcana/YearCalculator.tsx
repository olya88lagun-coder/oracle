"use client";

import { arcanumByNumber } from "@oracle/content";
import { calculateYearArcana, parseBirthDate, type YearArcana } from "@oracle/core";
import { useRef, useState, type FormEvent } from "react";
import { reachYearGoal } from "@/lib/year-arcana-analytics";
import { DATE_ERROR } from "@/lib/matrix-save";
import { YearResult } from "./YearResult";

export function YearCalculator() {
  const input = useRef<HTMLInputElement>(null);
  const [calculated, setCalculated] = useState<{ iso: string; result: YearArcana } | null>(null);
  const [error, setError] = useState("");
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const iso = input.current?.value ?? "";
    const result = calculateYearArcana(iso, new Date());
    if (!result) {
      setCalculated(null);
      setError(DATE_ERROR);
      input.current?.focus();
      return;
    }
    setError("");
    setCalculated({ iso, result });
    reachYearGoal("year_arcana_calculated");
  }
  const date = calculated ? parseBirthDate(calculated.iso, new Date()) : null;
  return <>
    <section className="year-hero" aria-labelledby="year-title">
      <div className="year-hero__copy stack">
        <p className="eyebrow">Новый год · новая точка внимания</p>
        <h1 className="display" id="year-title">Мой аркан <span>2027 года</span></h1>
        <p className="lead">С каким вопросом вы войдёте в новый год? Найдите свой символ по дате рождения — и превратите его в один осмысленный шаг.</p>
        <form className="year-form" onSubmit={calculate} noValidate>
          <div className="field"><label htmlFor="year-birth-date">Дата рождения</label>
            <input ref={input} id="year-birth-date" className="input" type="date" min="1900-01-01" required aria-invalid={Boolean(error)} aria-describedby={error ? "year-date-error year-privacy" : "year-privacy"} onChange={() => { setCalculated(null); setError(""); }} />
          </div>
          <button className="button button--lavender" type="submit">Узнать мой аркан 2027</button>
          {error && <p id="year-date-error" className="error" role="alert">{error}</p>}
          <p className="muted" id="year-privacy">Бесплатно, без регистрации. Дата остаётся в браузере.</p>
        </form>
      </div>
      <div className="year-hero__art" aria-hidden="true"><span>2027</span><p>Один символ.<br />Ваш собственный смысл.</p></div>
    </section>
    <div className="year-band"><span>22 аркана</span><span>Вопрос и действие</span><span>Карточка на память</span></div>
    {calculated && date && <YearResult key={calculated.iso} result={calculated.result} arcanum={arcanumByNumber(calculated.result.arcanum)} iso={calculated.iso} day={date.day} month={date.month} />}
  </>;
}
