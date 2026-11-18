"use client";

import { THREAD_REPORT_PRICE_KOPECKS } from "@oracle/core";
import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { checkoutParams, reachGoal, reachGoalThenNavigate } from "@/lib/analytics";
import { THREAD_PATH, THREAD_PRIMER_PATH } from "@/lib/life-thread";
import { REFUND_DAYS } from "@/lib/legal";
import { sessionStore } from "@/lib/matrix-save";
import { loginHref } from "@/lib/next-path";
import { EMAIL_ERROR, EMAIL_PATTERN, purchaseErrorCode, purchaseErrorMessage, reportPath } from "@/lib/report-offer";
import {
  THREAD_OFFER_BUY,
  THREAD_OFFER_CHAPTERS,
  THREAD_OFFER_DATA_NOTE,
  THREAD_OFFER_EMAIL_LABEL,
  THREAD_OFFER_EXAMPLE,
  THREAD_OFFER_FREE_BUY,
  THREAD_OFFER_FREE_NOTE,
  THREAD_OFFER_LEAD,
  THREAD_OFFER_LOGIN_BUY,
  THREAD_OFFER_TERMS,
  THREAD_OFFER_TEXT_NOTE,
  THREAD_OFFER_TITLE,
  threadOfferRefundLine,
} from "@/lib/thread-copy";
import { markThreadIntent, threadPurchaseBody } from "@/lib/thread-offer";
import { useOfferViewGoal } from "../useOfferViewGoal";

// Блок продажи «Разбора нити» под периодами. Дата рождения уходит на сервер только запросом покупки
type Props = { iso: string; signedIn: boolean; owner: boolean };

const PRICE = `${THREAD_REPORT_PRICE_KOPECKS / 100} ₽`;

function BuyForm({ iso, free, inputId }: { iso: string; free: boolean; inputId: string }) {
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
    if (!free) reachGoal("thread_offer_click");
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(threadPurchaseBody({ iso, email, free })) });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string; purchaseId?: string };
      if (body.ok && body.url) {
        if (free) return window.location.assign(body.url);
        return reachGoalThenNavigate("checkout_redirect", checkoutParams("thread"), body.url, (url) => window.location.assign(url));
      }
      if (body.error === "already_paid" && body.purchaseId) return window.location.assign(reportPath(body.purchaseId));
      if (!free) reachGoal("checkout_error", checkoutParams("thread", purchaseErrorCode(body.error)));
      setError(purchaseErrorMessage(body.error));
    } catch {
      if (!free) reachGoal("checkout_error", checkoutParams("thread", purchaseErrorCode(null)));
      setError(purchaseErrorMessage(null));
    }
    setBusy(false);
  }

  return (
    <form className="stack thread-offer__form" onSubmit={buy} noValidate>
      {!free && (
        <div className="field">
          <label htmlFor={inputId}>{THREAD_OFFER_EMAIL_LABEL}</label>
          <input ref={emailRef} id={inputId} className="input" type="email" autoComplete="email" inputMode="email" placeholder="name@example.ru" />
        </div>
      )}
      <button type="submit" className="button button--lavender" disabled={busy}>
        {free ? THREAD_OFFER_FREE_BUY : <span className="button__label">{THREAD_OFFER_BUY} — <span className="nowrap">{PRICE}</span></span>}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
      <p className="muted">{free ? THREAD_OFFER_FREE_NOTE : <>Оплата через ЮKassa. Нажимая кнопку, вы принимаете <Link href="/oferta">оферту</Link>.</>}</p>
    </form>
  );
}

export function ThreadReportOffer({ iso, signedIn, owner }: Props) {
  const id = useId();
  // У владелицы цели Метрики не считаются (как у натальной)
  const headingRef = useOfferViewGoal("thread_offer_view", !owner);
  return (
    <section className="thread-offer card card--accent" aria-labelledby={`${id}-title`}>
      <h3 ref={headingRef} id={`${id}-title`} className="thread-offer__title">{THREAD_OFFER_TITLE} — <span className="nowrap">{PRICE}</span></h3>
      <p className="lead">{THREAD_OFFER_LEAD}</p>
      <ol className="thread-offer__chapters">{THREAD_OFFER_CHAPTERS.map((chapter) => <li key={chapter}>{chapter}</li>)}</ol>
      <p><Link className="matrix-link" href={THREAD_PRIMER_PATH}>{THREAD_OFFER_EXAMPLE}</Link></p>
      {signedIn ? (
        <BuyForm iso={iso} free={owner} inputId={`${id}-email`} />
      ) : (
        <a className="button button--lavender thread-offer__cta" href={loginHref(THREAD_PATH)} onClick={() => { markThreadIntent(sessionStore(), iso); reachGoal("thread_offer_click"); }}>
          <span className="button__label">{THREAD_OFFER_LOGIN_BUY} — <span className="nowrap">{PRICE}</span></span>
        </a>
      )}
      <p className="muted">{THREAD_OFFER_TERMS} {THREAD_OFFER_TEXT_NOTE}</p>
      {!owner && <p className="muted thread-offer__refund">{threadOfferRefundLine(REFUND_DAYS)}</p>}
      <p className="muted">{THREAD_OFFER_DATA_NOTE}</p>
    </section>
  );
}
