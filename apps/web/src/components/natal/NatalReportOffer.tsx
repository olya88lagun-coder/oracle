"use client";

import { NATAL_REPORT_PRICE_KOPECKS, NATAL_REPORT_REFUND_DAYS } from "@oracle/core";
import { natalChapterOutline } from "@oracle/core/natal-report";
import type { NatalChart } from "@oracle/core/natal";
import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { checkoutParams, reachGoal, reachGoalThenNavigate } from "@/lib/analytics";
import { loginHref } from "@/lib/next-path";
import {
  OFFER_BUY,
  OFFER_DATA_NOTE,
  OFFER_EMAIL_LABEL,
  OFFER_FREE_BUY,
  OFFER_FREE_NOTE,
  OFFER_LEAD,
  OFFER_LOGIN_BUY,
  OFFER_NO_TIME,
  OFFER_TERMS,
  OFFER_TITLE,
  offerRefundLine,
} from "@/lib/natal-copy";
import type { NatalInput } from "@/lib/natal-input";
import type { ZoneChoice } from "@/lib/natal-moment";
import { NATAL_PATH } from "@/lib/natal-paths";
import { chapterLabel, type NatalOfferState } from "@/lib/natal-report-offer";
import { EMAIL_ERROR, EMAIL_PATTERN, purchaseErrorCode, purchaseErrorMessage, reportPath } from "@/lib/report-offer";
import { useOfferViewGoal } from "../useOfferViewGoal";

// Блок продажи «Разбор натальной карты» под результатом: оглавление девяти глав с положениями человека и кнопка по состоянию.
// Данные рождения уходят на сервер только запросом покупки; портрет они не меняют
type Props = { state: Exclude<NatalOfferState, { kind: "hidden" }>; chart: NatalChart; input: NatalInput; choice: ZoneChoice | null; free?: boolean };

const PRICE = `${NATAL_REPORT_PRICE_KOPECKS / 100} ₽`;

function birthBody(input: NatalInput, choice: ZoneChoice | null) {
  const { city } = input;
  return { birthDate: input.date, time: input.time, name: city.name, latitude: city.latitude, longitude: city.longitude, zone: city.zone, ...(choice ? { zoneChoice: choice } : {}) };
}

function BuyForm({ input, choice, free, inputId }: { input: NatalInput; choice: ZoneChoice | null; free: boolean; inputId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function buy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const email = emailRef.current?.value.trim() ?? "";
    if (!free && !EMAIL_PATTERN.test(email)) {
      setError(EMAIL_ERROR);
      emailRef.current?.focus();
      return;
    }
    if (!free) reachGoal("natal_offer_click");
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product: "natal_report", ...(free ? {} : { email }), birth: birthBody(input, choice) }),
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string; purchaseId?: string };
      if (body.ok && body.url) {
        if (free) return window.location.assign(body.url);
        return reachGoalThenNavigate("checkout_redirect", checkoutParams("natal"), body.url, (url) => window.location.assign(url));
      }
      if (body.error === "already_paid" && body.purchaseId) return window.location.assign(reportPath(body.purchaseId));
      if (!free) reachGoal("checkout_error", checkoutParams("natal", purchaseErrorCode(body.error)));
      setError(purchaseErrorMessage(body.error));
    } catch {
      if (!free) reachGoal("checkout_error", checkoutParams("natal", purchaseErrorCode(null)));
      setError(purchaseErrorMessage(null));
    }
    setBusy(false);
  }

  return (
    <form className="stack natal-offer__form" onSubmit={buy} noValidate>
      {!free && (
        <div className="field">
          <label htmlFor={inputId}>{OFFER_EMAIL_LABEL}</label>
          <input ref={emailRef} id={inputId} className="input" type="email" autoComplete="email" inputMode="email" placeholder="name@example.ru" />
        </div>
      )}
      <button type="submit" className="button button--lavender" disabled={busy}>
        {free ? OFFER_FREE_BUY : <span className="button__label">{OFFER_BUY} — <span className="nowrap">{PRICE}</span></span>}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="muted">{free ? OFFER_FREE_NOTE : <>Оплата через ЮKassa. Нажимая кнопку, вы принимаете <Link href="/oferta">оферту</Link>.</>}</p>
      <p className="muted">{OFFER_DATA_NOTE}</p>
    </form>
  );
}

export function NatalReportOffer({ state, chart, input, choice, free = false }: Props) {
  const id = useId();
  const headingRef = useOfferViewGoal("natal_offer_view", !free && state.kind !== "no_time");
  const outline = chart.timeKnown ? natalChapterOutline(chart) : [];
  return (
    <section className="natal-offer card card--accent" aria-labelledby={`${id}-title`}>
      <h3 ref={headingRef} id={`${id}-title`} className="natal-offer__title">
        {OFFER_TITLE} — <span className="nowrap">{PRICE}</span>
      </h3>
      <p className="lead">{OFFER_LEAD}</p>
      {state.kind === "no_time" && <p className="natal-offer__note">{OFFER_NO_TIME}</p>}
      {state.kind === "guest" && (
        <a className="button button--lavender natal-offer__cta" href={loginHref(NATAL_PATH)} onClick={() => reachGoal("natal_offer_click")}>
          <span className="button__label">{OFFER_LOGIN_BUY} — <span className="nowrap">{PRICE}</span></span>
        </a>
      )}
      {state.kind === "buy" && <BuyForm input={input} choice={choice} free={free} inputId={`${id}-email`} />}
      <p className="muted">{OFFER_TERMS}</p>
      {state.kind !== "no_time" && !free && <p className="muted natal-offer__refund">{offerRefundLine(NATAL_REPORT_REFUND_DAYS)}</p>}
      {outline.length > 0 && (
        <ol className="natal-offer__chapters report-toc">
          {outline.map((chapter, index) => (
            <li key={chapter.id}>
              <span className="report-toc__number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="report-toc__title">{chapter.title}</span>
              <span className="report-toc__arcana">{chapterLabel(chapter)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
