"use client";

import { SCENARIO_FIELDS, SCENARIO_TITLES } from "@oracle/core";
import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

// Пример разбора «как книга»: страницы листаются кнопками, стрелками и свайпом. Текст тот же, что в демонстрационном разборе ниже на странице;
// заголовки здесь — не h2, чтобы не дублировать структуру страницы
export type BookPage = { id: string; title: string; paragraphs?: readonly string[]; scenario?: Readonly<Record<string, string>> | null };
type Props = { cover: { title: string; subtitle: string; image: string }; pages: readonly BookPage[] };

const TURN_MS = 650;

export function ReportBook({ cover, pages }: Props) {
  const total = pages.length + 1;
  const [index, setIndex] = useState(0);
  // Страница, которая сейчас уходит (листаем вперёд) или приходит (листаем назад); null — покой
  const [turn, setTurn] = useState<{ from: number; dir: "next" | "prev" } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startX = useRef<number | null>(null);

  function go(delta: 1 | -1) {
    const next = index + delta;
    if (next < 0 || next >= total) return;
    clearTimeout(timer.current);
    setTurn({ from: index, dir: delta === 1 ? "next" : "prev" });
    setIndex(next);
    timer.current = setTimeout(() => setTurn(null), TURN_MS);
  }
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  };
  const onUp = (event: PointerEvent) => {
    if (startX.current === null) return;
    const dx = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  const render = (page: number) => {
    if (page === 0) {
      return (
        <div className="book__cover">
          <Image src={cover.image} alt="" width={480} height={480} unoptimized />
          <p className="eyebrow">{cover.subtitle}</p>
          <p className="book__title">{cover.title}</p>
          <p className="muted">Листайте — стрелками, кнопками или свайпом.</p>
        </div>
      );
    }
    const chapter = pages[page - 1]!;
    return (
      <div className="book__chapter">
        <p className="eyebrow">Глава {page}</p>
        <p className="book__title">{chapter.title}</p>
        {chapter.paragraphs?.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
        {chapter.scenario &&
          SCENARIO_FIELDS.map((field) => (
            <div key={field} className="book__field">
              <p className="eyebrow">{SCENARIO_TITLES[field]}</p>
              <p>{chapter.scenario![field]}</p>
            </div>
          ))}
      </div>
    );
  };

  return (
    <section className="book" aria-label="Пример разбора как книга" onKeyDown={onKey}>
      <div className="book__spread" onPointerDown={(event) => (startX.current = event.clientX)} onPointerUp={onUp} onPointerCancel={() => (startX.current = null)}>
        <div className="book__page book__page--current" key={`cur-${index}`} data-turn={turn?.dir === "prev" ? "in" : undefined}>
          {render(index)}
        </div>
        {turn && (
          <div className="book__page book__page--under" key={`under-${turn.from}`} data-turn={turn.dir === "next" ? "out" : undefined} aria-hidden="true">
            {render(turn.from)}
          </div>
        )}
      </div>
      <div className="book__controls">
        <button type="button" className="button button--ghost" onClick={() => go(-1)} disabled={index === 0}>
          Назад
        </button>
        <span role="status">
          Страница {index + 1} из {total}
        </span>
        <button type="button" className="button button--lavender" onClick={() => go(1)} disabled={index === total - 1}>
          Дальше
        </button>
      </div>
    </section>
  );
}
