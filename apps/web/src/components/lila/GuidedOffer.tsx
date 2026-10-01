"use client";

import { LILA_SESSION_PRICE_KOPECKS, LILA_SESSION_PRODUCT } from "@oracle/core";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { reachGoal } from "@/lib/analytics";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import { loginHref } from "@/lib/next-path";
import { EMAIL_ERROR, EMAIL_PATTERN, purchaseErrorMessage } from "@/lib/report-offer";
import { lilaPaymentPath } from "@/lib/lila-paths";

const PRICE = `${LILA_SESSION_PRICE_KOPECKS / 100} ₽`;
const INTENTION_MIN_CHARS = 3;
type Props = { intention: string; signedIn: boolean };

// Один платный блок на экране выбора: без таймеров и всплывающих окон
export function GuidedOffer({ intention, signedIn }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const ready = intention.trim().length >= INTENTION_MIN_CHARS;

  async function buy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !ready) return;
    const email = emailRef.current?.value.trim() ?? "";
    if (!EMAIL_PATTERN.test(email)) {
      setError(EMAIL_ERROR);
      emailRef.current?.focus();
      return;
    }
    reachGoal("lila_offer_click");
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product: LILA_SESSION_PRODUCT, email, intention }),
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string; purchaseId?: string };
      if (body.ok && body.url) return window.location.assign(body.url);
      // Оплаченная партия уже ждёт своей очереди: страница ожидания её запустит
      if (body.error === "already_paid" && body.purchaseId) return window.location.assign(lilaPaymentPath(body.purchaseId));
      setError(purchaseErrorMessage(body.error));
    } catch {
      setError(purchaseErrorMessage(null));
    }
    setBusy(false);
  }

  return (
    <section className="guided-offer" aria-labelledby="lila-offer-title">
      <h3 id="lila-offer-title">С проводником — {PRICE}</h3>
      <p>На каждом ходу — короткий абзац проводника, который связывает клетку с вашим намерением, а в конце партии — итоговый вывод.</p>
      <blockquote className="guided-offer__sample">«На клетке «Алчность» стоит заметить, как сравнение с другими может связываться с вашим вопросом о работе…» — пример абзаца.</blockquote>
      <p className="privacy">Намерение и записи, которые вы оставите в этой партии, передаются сервису подготовки текста (GigaChat, ПАО Сбербанк).</p>
      {signedIn ? (
        <form className="guided-offer__form" onSubmit={buy} noValidate>
          <label htmlFor="lila-receipt-email">E-mail для чека</label>
          <input ref={emailRef} id="lila-receipt-email" type="email" autoComplete="email" inputMode="email" placeholder="name@example.ru" />
          <button type="submit" className="button button--ghost" disabled={busy || !ready}>
            Начать с проводником — {PRICE}
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <Link className="text-link" href={loginHref(LILA_GAME_PATH)}>
          Войти и начать с проводником
          <Icon name="arrow-up-right" />
        </Link>
      )}
    </section>
  );
}
