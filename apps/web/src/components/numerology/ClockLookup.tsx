"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { blogPath, blogPostBySlug } from "@/lib/blog";
import { CLOCK_LOOKUP_ERROR, CLOCK_LOOKUP_LABEL, CLOCK_LOOKUP_ORDINARY, normalizeClockInput } from "@/lib/clock-lookup";

export type ClockLookupTime = { readonly label: string; readonly href: string | null };
type Outcome = { kind: "error" } | { kind: "found"; label: string; href: string } | { kind: "soon"; label: string } | { kind: "ordinary"; label: string };

const diary = blogPostBySlug("pochemu-zamechaem-odinakovye-tsifry-na-chasah");

// Быстрый ввод ЧЧ:ММ: показывает страницу значения или говорит, что время обычное. Введённое время никуда не отправляется и не сохраняется
export function ClockLookup({ times }: { times: readonly ClockLookupTime[] }) {
  const [value, setValue] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  function find(event: FormEvent) {
    event.preventDefault();
    const label = normalizeClockInput(value);
    if (!label) return setOutcome({ kind: "error" });
    const time = times.find((item) => item.label === label);
    if (!time) return setOutcome({ kind: "ordinary", label });
    setOutcome(time.href ? { kind: "found", label, href: time.href } : { kind: "soon", label });
  }

  return (
    <form className="stack clock-lookup" onSubmit={find} noValidate>
      <div className="field">
        <label htmlFor="clock-lookup-input">{CLOCK_LOOKUP_LABEL}</label>
        <input id="clock-lookup-input" className="input" inputMode="numeric" autoComplete="off" placeholder="11:11" value={value} onChange={(event) => { setValue(event.target.value); setOutcome(null); }} aria-invalid={outcome?.kind === "error"} aria-describedby={outcome?.kind === "error" ? "clock-lookup-error" : undefined} />
      </div>
      <button className="button" type="submit">Найти значение</button>
      {outcome?.kind === "error" && <p id="clock-lookup-error" className="error" role="alert">{CLOCK_LOOKUP_ERROR}</p>}
      <div className="clock-lookup__result" data-outcome={outcome?.kind} role="status">
        {outcome?.kind === "found" && <p><Link className="touch-link" href={outcome.href}>Открыть значение {outcome.label}</Link></p>}
        {outcome?.kind === "soon" && <p className="muted">Описание времени {outcome.label} появится позже.</p>}
        {outcome?.kind === "ordinary" && (
          <p>
            {CLOCK_LOOKUP_ORDINARY(outcome.label)} {diary && <Link className="touch-link" href={blogPath(diary)}>Как вести такой дневник</Link>}
          </p>
        )}
      </div>
    </form>
  );
}
