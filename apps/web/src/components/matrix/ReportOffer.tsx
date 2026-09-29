"use client";

import { MATRIX_REPORT_PRICE_KOPECKS, reportChapters, type Matrix } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { reachGoal } from "@/lib/analytics";
import { arcanumImage, MATRIX_PATH } from "@/lib/arcana-paths";
import { loginHref } from "@/lib/next-path";
import { chapterArcanaLabel, EMAIL_ERROR, EMAIL_PATTERN, purchaseErrorMessage, reportPath, teaserText, type OfferState } from "@/lib/report-offer";

type Props = { state: Exclude<OfferState, { kind: "hidden" }>; matrix: Matrix; onSaveDate: () => Promise<boolean> };

const PRICE = `${MATRIX_REPORT_PRICE_KOPECKS / 100} ₽`;

function ChapterList({ matrix }: { matrix: Matrix }) {
  return (
    <ol className="report-toc">
      {reportChapters(matrix).map((chapter, index) => (
        <li key={chapter.id}>
          <span className="report-toc__number" aria-hidden="true">
            {index + 1}
          </span>
          <span className="report-toc__title">{chapter.title}</span>
          <span className="report-toc__arcana">{chapterArcanaLabel(chapter)}</span>
        </li>
      ))}
    </ol>
  );
}

function BuyForm({ onSaveDate }: { onSaveDate: Props["onSaveDate"] }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function buy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const email = emailRef.current?.value.trim() ?? "";
    if (!EMAIL_PATTERN.test(email)) {
      setError(EMAIL_ERROR);
      emailRef.current?.focus();
      return;
    }
    reachGoal("report_offer_click");
    setBusy(true);
    setError(null);
    try {
      if (!(await onSaveDate())) throw new Error("no_birth_date");
      const response = await fetch("/api/purchases", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string; purchaseId?: string };
      if (body.ok && body.url) return window.location.assign(body.url);
      if (body.error === "already_paid" && body.purchaseId) return window.location.assign(reportPath(body.purchaseId));
      setError(purchaseErrorMessage(body.error));
    } catch (failure) {
      setError(purchaseErrorMessage(failure instanceof Error ? failure.message : null));
    }
    setBusy(false);
  }

  return (
    <form className="stack report-offer__form" onSubmit={buy} noValidate>
      <div className="field">
        <label htmlFor="receipt-email">E-mail для чека</label>
        <input ref={emailRef} id="receipt-email" className="input" type="email" autoComplete="email" inputMode="email" placeholder="name@example.ru" aria-describedby="receipt-note" />
      </div>
      <button type="submit" className="button button--lavender" disabled={busy}>
        Купить разбор — {PRICE}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p id="receipt-note" className="muted">
        Оплата через ЮKassa. Нажимая кнопку, вы принимаете <Link href="/oferta">оферту</Link>.
      </p>
    </form>
  );
}

// Цель «блок продажи показан» — один раз за показ страницы, когда блок хотя бы наполовину на экране
function useOfferViewGoal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        reachGoal("report_offer_view");
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function ReportOffer({ state, matrix, onSaveDate }: Props) {
  const center = arcanumByNumber(matrix.E);
  const love = arcanumByNumber(matrix.love);
  const ref = useOfferViewGoal();
  return (
    <section ref={ref} className="card report-offer" aria-labelledby="report-offer-title">
      <div className="stack report-offer__main">
        <p className="eyebrow">Разбор всей матрицы</p>
        <h2 id="report-offer-title" className="report-offer__title">
          Разбор всей матрицы — {PRICE}
        </h2>
        <p className="lead">
          Посмотрите, как ваши ключевые позиции работают вместе: в отношениях, в деньгах и деле, в опыте семьи и в предназначении, — и какой сценарий
          может повторяться. В конце — эксперимент на 7 дней.
        </p>
        <ChapterList matrix={matrix} />
      </div>
      <div className="stack report-offer__side">
        <Image className="report-offer__art" src={arcanumImage(center, "card")} alt="" width={480} height={480} sizes="(min-width: 960px) 380px, 100vw" unoptimized />
        <div className="report-offer__sample stack">
          <p className="eyebrow">Начало главы «Отношения»</p>
          <p className="report-offer__teaser">
            Ваша точка любви — {love.number} {love.name}. {teaserText(love.love.join(" "), 280)}
          </p>
          <p className="muted">Продолжение и то, как эта точка связана с сердцем матрицы, — в полном разборе.</p>
        </div>
        <p className="muted">Готов за несколько минут, хранится в «Моём портрете».</p>
        {state.kind === "guest" && (
          <p>
            <a className="button button--lavender" href={loginHref(MATRIX_PATH)} onClick={() => reachGoal("report_offer_click")}>
              Войти и купить разбор
            </a>
          </p>
        )}
        {state.kind === "save_first" && (
          <p className="muted">Разбор покупается для даты из портрета. Чтобы купить разбор этой даты, сначала сохраните её в портрет — блок выше.</p>
        )}
        {state.kind === "buy" && <BuyForm onSaveDate={onSaveDate} />}
        {state.kind === "open" && (
          <p>
            <Link className="button button--lavender" href={reportPath(state.purchaseId)}>
              Открыть разбор
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
