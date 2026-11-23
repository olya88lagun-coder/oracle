"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { pickDistinctIndexes, SUMMARY_FIELDS, spreadSummaryText, type SpreadNext, type SpreadPosition, type SpreadVariant, type SummaryValues } from "@/lib/taro-spreads";
import { TaroBack } from "./TaroBack";
import type { SpreadCardData } from "./spread-cards";

const MAX_QUESTION = 200;
const MAX_VARIANT = 80;
const MAX_SUMMARY = 400;
const VARIANTS: readonly SpreadVariant[] = ["А", "Б"];
const NO_VARIANTS = { А: "", Б: "" };
const NO_SUMMARY: SummaryValues = { noticed: "", open: "", step: "" };

// Выбор карт расклада: по рубашке на позицию. Карты выбираются случайно без повторов при первом открытии.
// Вопрос и карты живут только в состоянии страницы: ни в хранилище браузера, ни на сервер они не попадают
export function SpreadPlay({ name, positions, cards, next }: { name: string; positions: readonly SpreadPosition[]; cards: readonly SpreadCardData[]; next: SpreadNext }) {
  const [picked, setPicked] = useState<readonly number[] | null>(null);
  const [opened, setOpened] = useState<readonly boolean[]>(() => positions.map(() => false));
  const [question, setQuestion] = useState("");
  const [variants, setVariants] = useState(NO_VARIANTS);
  const [summary, setSummary] = useState(NO_SUMMARY);
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  const [ready, setReady] = useState(false);
  const finished = useRef(false);
  const readingRef = useRef<HTMLHeadingElement>(null);
  const slotsRef = useRef<HTMLOListElement>(null);

  // Клик до гидратации ничего не делает, поэтому рубашки недоступны, пока страница не ожила
  useEffect(() => setReady(true), []);

  const openedCount = opened.filter(Boolean).length;
  const complete = openedCount === positions.length;

  function open(slots: readonly number[]) {
    const drawn = picked ?? pickDistinctIndexes(positions.length, cards.length);
    const next = opened.map((value, index) => value || slots.includes(index));
    setPicked(drawn);
    setOpened(next);
    if (next.every(Boolean) && !finished.current) {
      finished.current = true;
      reachGoal("taro_spread");
      requestAnimationFrame(() => readingRef.current?.focus());
    } else if (!next.every(Boolean)) {
      // Нажатая рубашка исчезает вместе с фокусом: переводим его на следующую закрытую карту
      requestAnimationFrame(() => slotsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus());
    }
  }

  function again() {
    finished.current = false;
    setPicked(null);
    setSummary(NO_SUMMARY);
    setCopied(null);
    setOpened(positions.map(() => false));
    requestAnimationFrame(() => slotsRef.current?.querySelector("button")?.focus());
  }

  const status = openedCount === 0 ? "" : complete ? "Расклад готов." : `Открыто карт: ${openedCount} из ${positions.length}.`;
  const trimmed = question.trim();
  const hasVariants = positions.some((position) => position.variant);
  const variantName = (position: SpreadPosition) => (position.variant ? variants[position.variant].trim() : "");

  async function copySummary() {
    if (!picked) return;
    const text = spreadSummaryText({ name, question, variants, rows: positions.map((position, index) => ({ position, card: cards[picked[index]!]!.name })), summary });
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  }

  return (
    <section className="taro-spread-play" aria-labelledby="spread-play-title">
      <div className="taro-spread-table">
        <div className="taro-spread-stage">
          <h2 id="spread-play-title">Ваш расклад</h2>
          <div className="field">
            <label htmlFor="spread-question">Ваш вопрос (необязательно)</label>
            <input
              id="spread-question"
              className="input"
              type="text"
              maxLength={MAX_QUESTION}
              autoComplete="off"
              disabled={!ready}
              aria-describedby="spread-question-note"
              value={question}
              onChange={(event) => { setQuestion(event.target.value); setCopied(null); }}
            />
            <p id="spread-question-note" className="muted">
              Вопрос остаётся в вашем браузере и никуда не отправляется.
            </p>
          </div>
          {hasVariants && (
            <div className="field taro-spread-variants">
              <p id="spread-variants-note" className="muted">
                Назовите варианты своими словами, если хотите: они появятся в подписях к картам. Это необязательно.
              </p>
              {VARIANTS.map((variant) => (
                <div key={variant} className="field">
                  <label htmlFor={`spread-variant-${variant}`}>Вариант {variant} (необязательно)</label>
                  <input
                    id={`spread-variant-${variant}`}
                    className="input"
                    type="text"
                    maxLength={MAX_VARIANT}
                    autoComplete="off"
                    disabled={!ready}
                    aria-describedby="spread-variants-note"
                    value={variants[variant]}
                    onChange={(event) => { setVariants((current) => ({ ...current, [variant]: event.target.value })); setCopied(null); }}
                  />
                </div>
              ))}
            </div>
          )}
          <p id="spread-pick-label">Откройте карты по очереди: нажмите на рубашку.</p>
          <ol className="taro-spread-slots" aria-labelledby="spread-pick-label" ref={slotsRef}>
            {positions.map((position, index) => {
              const card = opened[index] && picked ? cards[picked[index]!] : undefined;
              return (
                <li key={position.title} className="taro-spread-slot">
                  {card ? (
                    <figure>
                      <Image src={card.image} alt="" width={277} height={480} unoptimized />
                      <figcaption>{card.name}</figcaption>
                    </figure>
                  ) : (
                    <button type="button" className="taro-pick taro-spread-pick" aria-label={`Позиция ${index + 1}: ${position.title}`} disabled={!ready} onClick={() => open([index])}>
                      <TaroBack />
                    </button>
                  )}
                  <p className="taro-spread-slot__title">
                    {index + 1}. {position.title}
                    {variantName(position) && <span className="muted taro-spread-slot__variant"> {variantName(position)}</span>}
                  </p>
                </li>
              );
            })}
          </ol>
          <div className="row taro-actions">
            {!complete && (
              <button type="button" className="button button--ghost" disabled={!ready} onClick={() => open(positions.map((_, index) => index))}>
                Открыть все карты
              </button>
            )}
            {complete && (
              <button type="button" className="button button--ghost" onClick={again}>
                Новый расклад
              </button>
            )}
            <p role="status" className="muted">
              {status}
            </p>
          </div>
        </div>
        <section className="taro-spread-key" aria-labelledby="spread-positions">
          <h2 id="spread-positions">Позиции расклада</h2>
          <ol className="taro-spread-positions">
            {positions.map((position) => (
              <li key={position.title}>
                <strong>{position.title}</strong>
                <span>{position.hint}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {openedCount > 0 && picked && (
        <section className="taro-spread-reading" aria-labelledby="spread-reading-title">
          <h2 id="spread-reading-title" ref={readingRef} tabIndex={-1}>
            Трактовка расклада
          </h2>
          {trimmed && <p className="taro-spread-question">Ваш вопрос: «{trimmed}»</p>}
          {positions.map((position, index) => {
            const card = opened[index] ? cards[picked[index]!] : undefined;
            const reading = card?.texts[position.source];
            if (!card || !reading) return null;
            return (
              <article key={position.title} className="taro-panel taro-spread-panel">
                <p className="eyebrow">
                  {index + 1}. {position.title}
                  {variantName(position) && <span className="taro-spread-panel__variant"> {variantName(position)}</span>}
                </p>
                <h3>
                  <Link href={card.path} target="_blank" rel="noopener">
                    {card.name}
                  </Link>
                </h3>
                <p className="muted">{position.hint}</p>
                {reading.list ? (
                  <ul>
                    {reading.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  reading.lines.map((line) => <p key={line}>{line}</p>)
                )}
              </article>
            );
          })}
          {complete && <p className="muted">Расклад — повод задать себе вопрос, а не прогноз. Полное значение карты открывается по её названию в новой вкладке.</p>}
          {complete && (
            <section className="taro-panel stack taro-spread-summary" aria-labelledby="spread-summary-title">
              <h2 id="spread-summary-title">Ваша сводка</h2>
              <p className="muted">Несколько слов своими словами: что отозвалось, что осталось вопросом и какой шаг можно сделать. Поля необязательны и остаются в вашем браузере.</p>
              <p id="spread-summary-lifetime" className="taro-spread-summary__lifetime">После обновления страницы сводка исчезнет.</p>
              {SUMMARY_FIELDS.map((field) => (
                <div key={field.id} className="field">
                  <label htmlFor={`spread-summary-${field.id}`}>{field.label}</label>
                  <textarea
                    id={`spread-summary-${field.id}`}
                    className="input"
                    rows={2}
                    aria-describedby="spread-summary-lifetime"
                    maxLength={MAX_SUMMARY}
                    value={summary[field.id]}
                    onChange={(event) => { setSummary((current) => ({ ...current, [field.id]: event.target.value })); setCopied(null); }}
                  />
                </div>
              ))}
              <div className="row taro-spread-summary__actions">
                <button type="button" className="button button--ghost" onClick={copySummary}>
                  Скопировать итог
                </button>
                <p role="status" className="muted taro-spread-summary__status" data-state={copied ?? "idle"}>
                  {copied === "ok" ? "Итог скопирован." : copied === "fail" ? "Не удалось скопировать: выделите текст вручную." : ""}
                </p>
              </div>
            </section>
          )}
          {complete && (
            <aside className="taro-panel taro-spread-next" aria-labelledby="spread-next-title">
              <h2 id="spread-next-title">Если хочется глубже</h2>
              <p>
                <strong>{next.title}.</strong> {next.text}
              </p>
              <Link className="button button--lavender" href={next.href} onClick={() => reachGoal("taro_to_practice")}>
                {next.label}
              </Link>
            </aside>
          )}
        </section>
      )}
    </section>
  );
}
