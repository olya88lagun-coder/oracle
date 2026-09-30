"use client";

import { calculateCompatibility, parseBirthDate, toIsoDate, type Compatibility } from "@oracle/core";
import { useRef, useState, type FormEvent } from "react";
import { reachGoal } from "@/lib/analytics";
import { COMPAT_CALC_ID } from "./CompatGuide";
import { CompatResult } from "./CompatResult";
import { CompatShare } from "./CompatShare";

const DATE_ERROR = "Проверьте даты: обе должны быть настоящими, не раньше 1900 года и не в будущем.";
const PDF_ERROR = "Не получилось собрать PDF. Попробуйте ещё раз чуть позже.";

type Dates = { a: string; b: string };

// Даты хранятся только в состоянии страницы: ни в адресе, ни в localStorage, ни на сервере (кроме запроса PDF)
export function CompatCalculator({ profileDate }: { profileDate: string | null }) {
  const [a, setA] = useState(profileDate ?? "");
  const [b, setB] = useState("");
  const [dates, setDates] = useState<Dates | null>(null);
  const [compat, setCompat] = useState<Compatibility | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const aRef = useRef<HTMLInputElement>(null);
  const bRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Значения читаем из полей: их могли ввести до гидратации
    const rawA = aRef.current?.value ?? a;
    const rawB = bRef.current?.value ?? b;
    setA(rawA);
    setB(rawB);
    const now = new Date();
    const first = parseBirthDate(rawA, now);
    const second = parseBirthDate(rawB, now);
    if (!first || !second) {
      setError(DATE_ERROR);
      setDates(null);
      setCompat(null);
      return;
    }
    setError(null);
    setDates({ a: toIsoDate(first), b: toIsoDate(second) });
    setCompat(calculateCompatibility(first, second));
    reachGoal("compat_calculated");
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function downloadPdf() {
    if (!dates || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/compat/pdf", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(dates) });
      if (!response.ok) throw new Error(String(response.status));
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "sovmestimost.pdf";
      link.click();
      URL.revokeObjectURL(url);
      reachGoal("compat_pdf");
    } catch {
      setError(PDF_ERROR);
    }
    setBusy(false);
  }

  function reset() {
    setDates(null);
    setCompat(null);
    setB("");
    setError(null);
  }

  return (
    <>
      <form id={COMPAT_CALC_ID} className="card compat-form" aria-labelledby="compat-calc-title" onSubmit={calculate} noValidate>
        <div className="compat-form__head stack">
          <h2 id="compat-calc-title">Рассчитать общий аркан</h2>
          <p className="muted">Дата партнёра остаётся на вашем устройстве.</p>
        </div>
        <div className="compat-form__fields">
          <div className="field">
            <label htmlFor="compat-date-a">Ваша дата рождения</label>
            <input ref={aRef} id="compat-date-a" className="input" type="date" min="1900-01-01" value={a} onChange={(event) => setA(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="compat-date-b">Дата рождения партнёра</label>
            <input ref={bRef} id="compat-date-b" className="input" type="date" min="1900-01-01" value={b} onChange={(event) => setB(event.target.value)} />
          </div>
        </div>
        <div className="stack compat-form__submit">
          <button type="submit" className="button button--lavender">
            Рассчитать совместимость
          </button>
          <p className="muted">Считается в вашем браузере. Дата партнёра нигде не сохраняется.</p>
        </div>
        {error && (
          <p className="error compat-form__error" role="alert">
            {error}
          </p>
        )}
      </form>

      {compat && (
        <CompatResult
          compat={compat}
          headingRef={headingRef}
          actions={
            <>
              <button type="button" className="button button--lavender" disabled={busy} onClick={() => void downloadPdf()}>
                Скачать PDF
              </button>
              <CompatShare />
              <button type="button" className="button button--ghost" onClick={reset}>
                Пересчитать
              </button>
            </>
          }
        />
      )}
    </>
  );
}
