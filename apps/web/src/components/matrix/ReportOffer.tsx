"use client";

import { MATRIX_REPORT_PRICE_KOPECKS, reportChapters, type Matrix } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { reachGoal, type Goal } from "@/lib/analytics";
import { arcanumImage, MATRIX_PATH } from "@/lib/arcana-paths";
import { loginHref } from "@/lib/next-path";
import { chapterArcanaLabel, EMAIL_ERROR, EMAIL_PATTERN, purchaseErrorMessage, reportPath, teaserText, type OfferState } from "@/lib/report-offer";

// compat — предложение под результатом совместимости: разбор покупается для собственной даты человека, а не для пары.
// Цели у него свои, чтобы конверсия матрицы не смешивалась с совместимостью
type CompatContext = { dateLabel: string; saveFirstNote: ReactNode; onLoginClick: () => void };
// free — владелица сайта: платное для неё бесплатно, почта не нужна, цели Метрики не считаются
type Props = { state: Exclude<OfferState, { kind: "hidden" }>; matrix: Matrix; onSaveDate: () => Promise<boolean>; compat?: CompatContext; free?: boolean };
type Goals = { view: Goal; click: Goal };

const PRICE = `${MATRIX_REPORT_PRICE_KOPECKS / 100} ₽`;
const MATRIX_GOALS: Goals = { view: "report_offer_view", click: "report_offer_click" };
const COMPAT_GOALS: Goals = { view: "compat_offer_view", click: "compat_offer_click" };

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

function BuyForm({ onSaveDate, clickGoal, free }: { onSaveDate: Props["onSaveDate"]; clickGoal: Goal; free: boolean }) {
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
    if (!free) reachGoal(clickGoal);
    setBusy(true);
    setError(null);
    try {
      if (!(await onSaveDate())) throw new Error("no_birth_date");
      const response = await fetch("/api/purchases", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(free ? {} : { email }) });
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
      {!free && (
        <div className="field">
          <label htmlFor="receipt-email">E-mail для чека</label>
          <input ref={emailRef} id="receipt-email" className="input" type="email" autoComplete="email" inputMode="email" placeholder="name@example.ru" aria-describedby="receipt-note" />
        </div>
      )}
      <button type="submit" className="button button--lavender" disabled={busy}>
        {free ? "Получить разбор бесплатно" : `Купить разбор — ${PRICE}`}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {free ? (
        <p className="muted">Вы владелица сайта: разбор для вас бесплатный, оплата и чек не нужны.</p>
      ) : (
        <p id="receipt-note" className="muted">
          Оплата через ЮKassa. Нажимая кнопку, вы принимаете <Link href="/oferta">оферту</Link>.
        </p>
      )}
    </form>
  );
}

// Цель «блок продажи показан» — один раз за показ страницы, когда заголовок блока хотя бы наполовину на экране.
// Следим за заголовком, а не за всем блоком: на телефоне блок выше двух экранов и «наполовину виден» не наступал бы никогда
function useOfferViewGoal(goal: Goal, enabled: boolean) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        reachGoal(goal);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [goal, enabled]);
  return ref;
}

// Действие по состоянию: кнопка стоит сразу под вводным абзацем, а не в конце колонки, и всегда с ценой
function OfferAction({ state, onSaveDate, goals, compat, free }: { state: Props["state"]; onSaveDate: Props["onSaveDate"]; goals: Goals; compat?: CompatContext; free: boolean }) {
  if (state.kind === "guest") {
    return (
      <a
        className="button button--lavender report-offer__cta"
        href={loginHref(MATRIX_PATH)}
        onClick={() => {
          compat?.onLoginClick();
          reachGoal(goals.click);
        }}
      >
        Войти и купить разбор — {PRICE}
      </a>
    );
  }
  if (state.kind === "save_first") {
    return <p className="muted">{compat?.saveFirstNote ?? "Разбор покупается для даты из портрета. Чтобы купить разбор этой даты, сначала сохраните её в портрет — блок ниже."}</p>;
  }
  if (state.kind === "buy") return <BuyForm onSaveDate={onSaveDate} clickGoal={goals.click} free={free} />;
  return (
    <Link className="button button--lavender report-offer__cta" href={reportPath(state.purchaseId)}>
      Открыть разбор
    </Link>
  );
}

export function ReportOffer({ state, matrix, onSaveDate, compat, free = false }: Props) {
  const center = arcanumByNumber(matrix.E);
  const love = arcanumByNumber(matrix.love);
  const goals = compat ? COMPAT_GOALS : MATRIX_GOALS;
  const ref = useOfferViewGoal(goals.view, !free);
  return (
    <section className="card card--accent report-offer" aria-labelledby="report-offer-title">
      <div className="stack report-offer__main">
        <p className="eyebrow">{compat ? `Разбор вашей матрицы · по дате ${compat.dateLabel}` : "Разбор всей матрицы"}</p>
        <h2 ref={ref} id="report-offer-title" className="report-offer__title">
          Разбор всей матрицы — {PRICE}
        </h2>
        <p className="lead">
          {compat
            ? "Совместимость показала, как ваша дата встречается с датой партнёра. Полный разбор — про вас: семь глав о том, как ваши ключевые точки работают вместе: "
            : "Бесплатный расчёт показал три ключевые точки. В полном разборе — семь глав о том, как они работают вместе: "}
          в отношениях, в деньгах и деле, в опыте семьи и в предназначении, и какой сценарий может повторяться. В конце — эксперимент на 7 дней.
        </p>
        <div className="stack report-offer__action">
          <OfferAction state={state} onSaveDate={onSaveDate} goals={goals} compat={compat} free={free} />
          <p className="muted">Готов за несколько минут, хранится в «Моём портрете».</p>
        </div>
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
      </div>
    </section>
  );
}
