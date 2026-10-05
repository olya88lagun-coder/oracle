"use client";

import { LILA_CONCLUSION_CHAPTERS, LILA_CONCLUSION_TITLES, LILA_SESSION_PRICE_KOPECKS, LILA_SESSION_PRODUCT } from "@oracle/core";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { checkoutParams, reachGoal, reachGoalThenNavigate } from "@/lib/analytics";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import { loginHref } from "@/lib/next-path";
import { EMAIL_ERROR, EMAIL_PATTERN, purchaseErrorCode, purchaseErrorMessage } from "@/lib/report-offer";
import { lilaPaymentPath } from "@/lib/lila-paths";
import { useOfferViewGoal } from "../useOfferViewGoal";

const PRICE = `${LILA_SESSION_PRICE_KOPECKS / 100} ₽`;
const INTENTION_MIN_CHARS = 3;
const CONCLUSION_CHAPTERS = LILA_CONCLUSION_CHAPTERS.map((id) => `«${LILA_CONCLUSION_TITLES[id]}»`).join(", ");
// free — владелица сайта: проводник для неё бесплатный, почта не нужна
type Props = { intention: string; signedIn: boolean; free?: boolean };

// Один платный блок на экране выбора: без таймеров и всплывающих окон
export function GuidedOffer({ intention, signedIn, free = false }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const ready = intention.trim().length >= INTENTION_MIN_CHARS;
  const titleRef = useOfferViewGoal("lila_offer_view", !free);

  async function buy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !ready) return;
    const email = emailRef.current?.value.trim() ?? "";
    if (!free && !EMAIL_PATTERN.test(email)) {
      setError(EMAIL_ERROR);
      emailRef.current?.focus();
      return;
    }
    if (!free) reachGoal("lila_offer_click");
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(free ? { product: LILA_SESSION_PRODUCT, intention } : { product: LILA_SESSION_PRODUCT, email, intention }),
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string; purchaseId?: string };
      if (body.ok && body.url) {
        if (free) return window.location.assign(body.url);
        return reachGoalThenNavigate("checkout_redirect", checkoutParams("lila"), body.url, (url) => window.location.assign(url));
      }
      // Оплаченная партия уже ждёт своей очереди: страница ожидания её запустит
      if (body.error === "already_paid" && body.purchaseId) return window.location.assign(lilaPaymentPath(body.purchaseId));
      if (!free) reachGoal("checkout_error", checkoutParams("lila", purchaseErrorCode(body.error)));
      setError(purchaseErrorMessage(body.error));
    } catch {
      if (!free) reachGoal("checkout_error", checkoutParams("lila", purchaseErrorCode(null)));
      setError(purchaseErrorMessage(null));
    }
    setBusy(false);
  }

  return (
    <section className="guided-offer" aria-labelledby="lila-offer-title">
      <h3 ref={titleRef} id="lila-offer-title">
        С проводником — <span className="nowrap">{PRICE}</span>
      </h3>
      <p>Одна партия с сопровождением по вашему вопросу. На каждом ходу проводник связывает клетку с вашим намерением. Абзацы проводника пишет ИИ.</p>
      <p>После завершения партии получите итог из четырёх глав: {CONCLUSION_CHAPTERS}. Итог можно скачать в PDF.</p>
      <blockquote className="guided-offer__sample">«На клетке «Алчность» стоит заметить, как сравнение с другими может связываться с вашим вопросом о работе…» — пример абзаца.</blockquote>
      <p className="privacy">Намерение и записи, которые вы оставите в этой партии, передаются сервису подготовки текста (GigaChat, ПАО Сбербанк).</p>
      {signedIn ? (
        <form className="guided-offer__form" onSubmit={buy} noValidate>
          {!free && (
            <>
              <label htmlFor="lila-receipt-email">E-mail для чека</label>
              <input ref={emailRef} id="lila-receipt-email" type="email" autoComplete="email" inputMode="email" placeholder="name@example.ru" />
            </>
          )}
          <button type="submit" className="button button--ghost" disabled={busy || !ready}>
            {free ? "Начать с проводником — бесплатно для вас" : <span className="button__label">Начать с проводником — <span className="nowrap">{PRICE}</span></span>}
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <Link className="text-link" href={loginHref(LILA_GAME_PATH)} onClick={() => reachGoal("lila_login_click")}>
          Войти и начать с проводником
          <Icon name="arrow-up-right" />
        </Link>
      )}
      {!free && <p className="privacy"><span className="nowrap">{PRICE}</span> за одну новую партию. Оплата до начала игры. Вход через VK ID нужен для партии с проводником.</p>}
    </section>
  );
}
