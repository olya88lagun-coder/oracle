"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { reachNumerologyGoal } from "@/lib/numerology";
import { pairOutcome, type PairOutcome } from "@/lib/pythagoras-compat";
import { PythagorasCompatResult, type PairTexts } from "./PythagorasCompatResult";

// Даты живут только в состоянии страницы: ни в адресе, ни в хранилище браузера, ни на сервере
export function PythagorasCompatCalculator({ texts }: { texts: PairTexts }) {
  const you = useRef<HTMLInputElement>(null);
  const partner = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<PairOutcome | null>(null);
  function compare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = pairOutcome(you.current?.value ?? "", partner.current?.value ?? "", new Date());
    setOutcome(next);
    if (next.ok) reachNumerologyGoal("pythagoras_compat_calculated");
    else (next.field === "you" ? you : partner).current?.focus();
  }
  const resultKey = outcome?.ok ? outcome.key : null;
  useEffect(() => {
    if (resultKey) document.getElementById("pair-result-title")?.focus();
  }, [resultKey]);
  const error = (field: "you" | "partner") => (outcome && !outcome.ok && outcome.field === field ? outcome.error : "");
  const field = (name: "you" | "partner", label: string, ref: typeof you) => {
    const id = `pair-${name}-date`;
    const message = error(name);
    return <div className="field">
      <label htmlFor={id}>{label}</label>
      <input ref={ref} id={id} className="input" type="date" min="1900-01-01" required aria-invalid={Boolean(message)} aria-describedby={message ? `${id}-error pair-privacy` : "pair-privacy"} onChange={() => setOutcome(null)} />
      {message && <p id={`${id}-error`} className="error" role="alert">{message}</p>}
    </div>;
  };
  return <>
    <section className="year-hero numerology-pair-hero" aria-labelledby="pair-title">
      <div className="year-hero__copy stack">
        <p className="eyebrow">Нумерология · квадрат Пифагора</p>
        <h1 className="display" id="pair-title">Совместимость по квадрату Пифагора</h1>
        <p className="lead">Два квадрата рядом: в каких ячейках и линиях вы похожи, а где каждый устроен по-своему. Без процентов и вердиктов — как повод для разговора.</p>
        <form className="year-form" onSubmit={compare} noValidate>
          {field("you", "Ваша дата рождения", you)}
          {field("partner", "Дата рождения партнёра", partner)}
          <button className="button" type="submit">Сравнить квадраты</button>
          <p className="muted" id="pair-privacy">Бесплатно, без регистрации. Даты остаются в браузере.</p>
        </form>
      </div>
      <div className="year-hero__art" aria-hidden="true">
        <Image src="/images/numerology/pythagoras-compat-hero.webp" alt="" fill unoptimized />
        <span>3×3</span>
        <p>два квадрата<br />одна пара</p>
      </div>
    </section>
    {outcome?.ok && <PythagorasCompatResult key={outcome.key} outcome={outcome} texts={texts} />}
  </>;
}
