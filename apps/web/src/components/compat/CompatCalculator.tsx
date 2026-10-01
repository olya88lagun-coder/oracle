"use client";

import { calculateCompatibility, calculateMatrix, formatBirthDateRu, parseBirthDate, toIsoDate, type Compatibility } from "@oracle/core";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ReportOffer } from "@/components/matrix/ReportOffer";
import { reachGoal } from "@/lib/analytics";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { browserStorage, storeBirthDate } from "@/lib/birth-date-storage";
import { offerState, type PaidReport } from "@/lib/report-offer";
import { COMPAT_CALC_ID } from "./CompatGuide";
import { CompatResult } from "./CompatResult";
import { CompatShare } from "./CompatShare";

const DATE_ERROR = "Проверьте даты: обе должны быть настоящими, не раньше 1900 года и не в будущем.";
const PDF_ERROR = "Не получилось собрать PDF. Попробуйте ещё раз чуть позже.";

type Dates = { a: string; b: string };

// paidReports — продажа разбора включена; paid — уже купленные разборы этого пользователя (по датам)
type Props = { profileDate: string | null; signedIn: boolean; paidReports: boolean; paid: readonly PaidReport[]; ownerFree?: boolean };

// Даты хранятся только в состоянии страницы: ни в адресе, ни в localStorage, ни на сервере (кроме запроса PDF).
// Исключение — собственная дата человека: её запоминает и сохраняет только явное действие под результатом (вход или покупка разбора)
export function CompatCalculator({ profileDate, signedIn, paidReports, paid, ownerFree = false }: Props) {
  const [a, setA] = useState(profileDate ?? "");
  const [b, setB] = useState("");
  const [dates, setDates] = useState<Dates | null>(null);
  const [compat, setCompat] = useState<Compatibility | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedDate, setSavedDate] = useState(profileDate);
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

  // true — дата в портрете; покупка разбора ждёт этого ответа
  async function saveOwnDate(iso: string): Promise<boolean> {
    try {
      const response = await fetch("/api/profile/birth-date", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ birthDate: iso }) });
      if (!response.ok) return false;
      reachGoal("birth_date_saved");
      setSavedDate(iso);
      return true;
    } catch {
      return false;
    }
  }

  function reset() {
    setDates(null);
    setCompat(null);
    setB("");
    setError(null);
  }

  // Предложение разбора — для собственной даты (первое поле), а не для пары: даты партнёра сервер так и не получает
  const ownDate = dates ? parseBirthDate(dates.a, new Date()) : null;
  const offer = dates && ownDate ? offerState({ enabled: paidReports, signedIn, date: dates.a, profileDate: savedDate, paid }) : null;

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

      {compat && dates && ownDate && offer && offer.kind !== "hidden" && (
        <ReportOffer
          state={offer}
          matrix={calculateMatrix(ownDate)}
          free={ownerFree}
          onSaveDate={() => (savedDate === dates.a ? Promise.resolve(true) : saveOwnDate(dates.a))}
          compat={{
            dateLabel: formatBirthDateRu(ownDate),
            saveFirstNote: (
              <>
                Разбор покупается для даты из портрета, а в портрете другая дата. Сохранить эту дату можно на <Link href={MATRIX_PATH}>странице матрицы</Link>.
              </>
            ),
            // Своя дата переживает вход через VK ID в этом браузере; дата партнёра никуда не записывается
            onLoginClick: () => storeBirthDate(browserStorage(), dates.a),
          }}
        />
      )}
    </>
  );
}
