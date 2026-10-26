"use client";

import type { Arcanum } from "@oracle/content";
import { MATRIX_REPORT_PRICE_KOPECKS, type YearArcana } from "@oracle/core";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { reachYearGoal } from "@/lib/year-arcana-analytics";
import { whenAnalyticsReady } from "@/lib/analytics-runtime";
import { arcanumImage, arcanumPath, MATRIX_PATH } from "@/lib/arcana-paths";
import { sessionStore } from "@/lib/matrix-save";
import { prepareMatrixHandoff } from "@/lib/year-arcana";
import { yearAdvice } from "@/lib/year-arcana-advice";
import { YearCardActions } from "./YearCardActions";

function YearOffer({ iso }: { iso: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let visible = false;
    let sent = false;
    const send = () => { if (visible && !sent && reachYearGoal("year_arcana_offer_view")) sent = true; };
    const stop = whenAnalyticsReady(send);
    const observer = new IntersectionObserver((entries) => { visible = entries.some((entry) => entry.isIntersecting); send(); }, { threshold: 0.5 });
    observer.observe(ref.current);
    return () => { stop(); observer.disconnect(); };
  }, []);
  return <aside className="year-offer stack" aria-labelledby="year-offer-title">
    <p className="eyebrow">Следующий шаг</p>
    <h2 id="year-offer-title" ref={ref}>Один аркан — начало.<br />В Матрице — целая картина.</h2>
    <p>Посмотрите, как связаны ваши Личность, Центр и Задача. На странице Матрицы доступен полный разбор по дате рождения за {MATRIX_REPORT_PRICE_KOPECKS / 100} ₽.</p>
    <p><Link className="button" href={MATRIX_PATH} prefetch={false} onClick={() => {
      prepareMatrixHandoff(sessionStore(), iso);
      reachYearGoal("year_arcana_to_matrix");
    }}>К Матрице и разбору за {MATRIX_REPORT_PRICE_KOPECKS / 100} ₽</Link></p>
    <p className="muted">Расчёт Матрицы бесплатный. Полный разбор — отдельная покупка, без годового прогноза. Дата перейдёт в Матрицу только в этой вкладке.</p>
  </aside>;
}

export function YearResult({ result, arcanum, iso, day, month }: { result: YearArcana; arcanum: Arcanum; iso: string; day: number; month: number }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [iso]);

  return <section className="year-result" aria-labelledby="year-result-title">
    <div className="year-result__header stack">
      <p className="eyebrow">Ваш символ на 2027 год</p>
      <h2 id="year-result-title" ref={heading} tabIndex={-1}>Аркан {arcanum.number} — {arcanum.name}</h2>
      <p className="lead">{arcanum.keywords.join(" · ")}</p>
    </div>
    <div className="year-result__grid">
      <div>
        <div className="year-share-card">
          <p className="eyebrow">Мой аркан 2027</p>
          <Image src={arcanumImage(arcanum)} width={960} height={960} alt={`Аркан ${arcanum.number} — ${arcanum.name}`} unoptimized />
          <p className="year-share-card__name">{arcanum.number}. {arcanum.name}</p>
          <p className="year-share-card__question">{arcanum.question}</p>
          <p className="muted">Твой оракул · символ, не прогноз</p>
        </div>
        <YearCardActions arcanum={arcanum} />
      </div>
      <div className="year-reading stack">
        <h3>С какой темой войти в год</h3>
        {arcanum.essence.map((text) => <p key={text}>{text}</p>)}
        <p className="muted">Ниже — значения аркана из нашего справочника. Примерьте их к своим планам на 2027 год: это вопросы для размышления, не обещание событий.</p>
        <div className="year-reading__pair">
          <section><h3>На что опереться</h3><ul>{arcanum.resource.map((text) => <li key={text}>{text}</li>)}</ul></section>
          <section><h3>Что стоит замечать</h3><ul>{arcanum.distortion.map((text) => <li key={text}>{text}</li>)}</ul></section>
        </div>
        <details><summary>В отношениях</summary>{arcanum.love.map((text) => <p key={text}>{text}</p>)}</details>
        <details><summary>В деньгах и деле</summary>{arcanum.money.map((text) => <p key={text}>{text}</p>)}</details>
        <details><summary>В самореализации</summary>{arcanum.task.map((text) => <p key={text}>{text}</p>)}</details>
        <section className="year-action stack"><h3>Три практических совета</h3><ol className="year-advice">{yearAdvice(arcanum).map((tip) => <li key={tip.title}><strong>{tip.title}</strong><p>{tip.text}</p></li>)}</ol><p><strong>Вопрос для себя:</strong> {arcanum.question}</p></section>
        <details className="year-calculation"><summary>Как получился ваш аркан</summary>
          <p>Центр вашей Матрицы: <strong>{result.center}</strong>. Он рассчитан по полной дате рождения тем же алгоритмом, что и на странице Матрицы.</p>
          <p>Число 2027 года: 2 + 0 + 2 + 7 = 11.</p>
          <p>День + месяц + 11: {day} + {month} + 11 = {day + month + 11}. После свёртки: <strong>{result.annual}</strong>.</p>
          <p>Центр + число года: {result.center} + {result.annual} = {result.center + result.annual}. После свёртки: <strong>{result.arcanum}</strong>.</p>
          <p>Свёртка: пока число больше 22, складываем его цифры. День берём целиком; 22 сохраняем.</p>
        </details>
        <Link className="touch-link" href={arcanumPath(arcanum)}>Читать полное значение аркана {arcanum.number}</Link>
      </div>
    </div>
    <YearOffer iso={iso} />
  </section>;
}
