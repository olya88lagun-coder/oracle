"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { reachGoal } from "@/lib/analytics";
import { pickDistinctIndexes, type SpreadNext, type SpreadPosition } from "@/lib/taro-spreads";
import { TaroBack } from "./TaroBack";
import type { SpreadCardData } from "./spread-cards";

const MAX_QUESTION = 200;

// Выбор карт расклада: по рубашке на позицию. Карты выбираются случайно без повторов при первом открытии.
// Вопрос и карты живут только в состоянии страницы: ни в хранилище браузера, ни на сервер они не попадают
export function SpreadPlay({ positions, cards, next }: { positions: readonly SpreadPosition[]; cards: readonly SpreadCardData[]; next: SpreadNext }) {
  const [picked, setPicked] = useState<readonly number[] | null>(null);
  const [opened, setOpened] = useState<readonly boolean[]>(() => positions.map(() => false));
  const [question, setQuestion] = useState("");
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
    setOpened(positions.map(() => false));
    requestAnimationFrame(() => slotsRef.current?.querySelector("button")?.focus());
  }

  const status = openedCount === 0 ? "" : complete ? "Расклад готов." : `Открыто карт: ${openedCount} из ${positions.length}.`;
  const trimmed = question.trim();

  return (
    <section className="taro-spread-play" aria-labelledby="spread-play-title">
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
          onChange={(event) => setQuestion(event.target.value)}
        />
        <p id="spread-question-note" className="muted">
          Вопрос остаётся в вашем браузере и никуда не отправляется.
        </p>
      </div>
      <p id="spread-pick-label">Откройте карты по очереди: нажмите на рубашку.</p>
      <ol className="taro-spread-slots" aria-labelledby="spread-pick-label" style={{ "--spread-cols": positions.length } as CSSProperties} ref={slotsRef}>
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
