"use client";

import { MATRIX_REPORT_PRICE_KOPECKS, reportChapters, type Matrix } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { checkoutParams, reachGoal, reachGoalThenNavigate, type CheckoutProduct, type Goal } from "@/lib/analytics";
import { arcanumImage, MATRIX_PATH } from "@/lib/arcana-paths";
import { loginHref } from "@/lib/next-path";
import { chapterArcanaLabel, EMAIL_ERROR, EMAIL_PATTERN, purchaseErrorCode, purchaseErrorMessage, reportPath, type OfferState } from "@/lib/report-offer";
import { useOfferViewGoal } from "../useOfferViewGoal";
import { chapterTeaser, QUESTION_TOPICS, type TeaserChapter } from "./chapter-teaser";

// compat — предложение под результатом совместимости: разбор покупается для собственной даты человека, а не для пары.
// Цели у него свои, чтобы конверсия матрицы не смешивалась с совместимостью
type CompatContext = { dateLabel: string; saveFirstNote: ReactNode; onLoginClick: () => void };
// free — владелица сайта: платное для неё бесплатно, почта не нужна, цели Метрики не считаются
type Props = { state: Exclude<OfferState, { kind: "hidden" }>; matrix: Matrix; onSaveDate: () => Promise<boolean>; compat?: CompatContext; free?: boolean };
type Goals = { view: Goal; click: Goal };

const PRICE = `${MATRIX_REPORT_PRICE_KOPECKS / 100} ₽`;
const MATRIX_GOALS: Goals = { view: "report_offer_view", click: "report_offer_click" };
const COMPAT_GOALS: Goals = { view: "compat_offer_view", click: "compat_offer_click" };

// Главы, кроме выбранной темы, «запечатаны»: тонкий замок у номера. Выбранная глава отмечена — это та, о которой человек хочет прочитать
function ChapterList({ matrix, topic }: { matrix: Matrix; topic: TeaserChapter }) {
  return (
    <ol className="report-toc report-toc--sealed">
      {reportChapters(matrix).map((chapter, index) => (
        <li key={chapter.id} data-chosen={chapter.id === topic ? "true" : undefined}>
          <span className="report-toc__number" aria-hidden="true">
            {index + 1}
          </span>
          <span className="report-toc__title">
            {chapter.title}
            {chapter.id === topic && <span className="report-toc__chosen"> · ваш вопрос</span>}
          </span>
          <span className="report-toc__arcana">{chapterArcanaLabel(chapter)}</span>
        </li>
      ))}
    </ol>
  );
}

function BuyForm({ onSaveDate, clickGoal, product, free }: { onSaveDate: Props["onSaveDate"]; clickGoal: Goal; product: CheckoutProduct; free: boolean }) {
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
      if (body.ok && body.url) {
        if (free) return window.location.assign(body.url);
        return reachGoalThenNavigate("checkout_redirect", checkoutParams(product), body.url, (url) => window.location.assign(url));
      }
      if (body.error === "already_paid" && body.purchaseId) return window.location.assign(reportPath(body.purchaseId));
      if (!free) reachGoal("checkout_error", checkoutParams(product, purchaseErrorCode(body.error)));
      setError(purchaseErrorMessage(body.error));
    } catch (failure) {
      const code = failure instanceof Error ? failure.message : null;
      if (!free) reachGoal("checkout_error", checkoutParams(product, purchaseErrorCode(code)));
      setError(purchaseErrorMessage(code));
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
        {free ? "Получить разбор бесплатно" : <span className="button__label">Купить разбор — <span className="nowrap">{PRICE}</span></span>}
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
        <span className="button__label">
          Войти и купить разбор — <span className="nowrap">{PRICE}</span>
        </span>
      </a>
    );
  }
  if (state.kind === "save_first") {
    return <p className="muted">{compat?.saveFirstNote ?? "Разбор покупается для даты из портрета. Чтобы купить разбор этой даты, сначала сохраните её в портрет — блок ниже."}</p>;
  }
  if (state.kind === "buy") return <BuyForm onSaveDate={onSaveDate} clickGoal={goals.click} product={compat ? "compat" : "matrix"} free={free} />;
  return (
    <Link className="button button--lavender report-offer__cta" href={reportPath(state.purchaseId)}>
      Открыть разбор
    </Link>
  );
}

export function ReportOffer({ state, matrix, onSaveDate, compat, free = false }: Props) {
  const center = arcanumByNumber(matrix.E);
  // Тема вопроса меняет только то, какую главу показывает превью справа; цена, кнопки и тексты разбора не меняются
  const [topic, setTopic] = useState<TeaserChapter>("love");
  const teaser = chapterTeaser(matrix, topic);
  const chapterNumber = reportChapters(matrix).findIndex((chapter) => chapter.id === topic) + 1;
  const goals = compat ? COMPAT_GOALS : MATRIX_GOALS;
  const ref = useOfferViewGoal(goals.view, !free);
  return (
    <section className="card card--accent report-offer" aria-labelledby="report-offer-title">
      <div className="stack report-offer__main">
        <p className="eyebrow">{compat ? `Разбор вашей матрицы · по дате ${compat.dateLabel}` : "Разбор всей матрицы"}</p>
        <h2 ref={ref} id="report-offer-title" className="report-offer__title">
          Разбор всей матрицы — <span className="nowrap">{PRICE}</span>
        </h2>
        <p className="lead">
          {compat
            ? "Личный разбор по вашей дате рождения. Внутри семь глав вашей матрицы и эксперимент на 7 дней. Отдельный платный разбор пары здесь не предлагается."
            : "Получите семь глав по вашей матрице: о личности и центре, задаче, отношениях, деньгах и деле, роде, предназначениях и вашем сценарии. В итоговой главе есть эксперимент на 7 дней и вопрос для себя."}
        </p>
        <div className="stack report-offer__action">
          <OfferAction state={state} onSaveDate={onSaveDate} goals={goals} compat={compat} free={free} />
          <p className="muted">
            Разовая оплата за разбор одной даты. Готов за несколько минут, хранится в «Моём портрете», пока вы не удалите свои данные, и скачивается в PDF.
          </p>
          <p className="muted">Текст готовится автоматически с помощью ИИ на основе описаний арканов вашей матрицы.</p>
        </div>
        <ChapterList matrix={matrix} topic={topic} />
      </div>
      <div className="stack report-offer__side">
        <Image className="report-offer__art" src={arcanumImage(center, "card")} alt="" width={480} height={480} sizes="(min-width: 960px) 380px, 100vw" unoptimized />
        <div className="report-offer__topics stack" role="group" aria-labelledby="report-topic-label">
          <p id="report-topic-label" className="eyebrow">
            О чём ваш вопрос?
          </p>
          <div className="report-topics">
            {QUESTION_TOPICS.map((item) => (
              <button key={item.chapter} type="button" className="report-topic" aria-pressed={item.chapter === topic} onClick={() => setTopic(item.chapter)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="report-offer__sample report-sealed stack">
          <p className="eyebrow">Основа главы «{teaser.title}» · ваши арканы</p>
          {/* key — чтобы при смене темы текст появлялся заново */}
          <div key={topic} className="report-sealed__text stack">
            <dl className="relation-link">
              {teaser.points.map((item) => (
                <div key={item.role} className="relation-link__point">
                  <dt>
                    {item.role}: <span className="relation-link__number">{item.number}</span> {item.name}
                  </dt>
                  <dd>{item.meaning}</dd>
                </div>
              ))}
            </dl>
            <p className="relation-link__text">{teaser.text}</p>
          </div>
          <p className="report-sealed__seal">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span>Дальше разбор развивает это в целый текст — глава {chapterNumber} и ещё шесть.</span>
          </p>
          <Link className="text-link" href="/matrica-sudby/primer">Посмотреть полный пример и PDF</Link>
        </div>
      </div>
    </section>
  );
}
