"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Board } from "./Board";

const DEFAULT_TRAIL = [6, 8, 10, 23];

export function BoardPreviewControls() {
  const [current, setCurrent] = useState(23);
  const trail = useMemo(() => {
    if (DEFAULT_TRAIL.includes(current)) return DEFAULT_TRAIL;
    return [...DEFAULT_TRAIL, current];
  }, [current]);

  return (
    <div className="stack">
      <section className="card card--accent lila-preview-controls" aria-labelledby="lila-preview-controls-title">
        <div className="stack">
          <div>
            <p className="eyebrow eyebrow--line">Dev preview</p>
            <h1 id="lila-preview-controls-title" className="display">
              Поле Лилы
            </h1>
          </div>
          <p className="lead">
            Только визуальное отображение поля: сетка, змеи, стрелы, текущая клетка, след и цель. Игровой логики, бросков и текстов ходов
            здесь нет.
          </p>
          <label className="field lila-preview-controls__field">
            <span>Текущая клетка</span>
            <input
              className="input"
              type="range"
              min="1"
              max="72"
              value={current}
              onChange={(event) => setCurrent(Number(event.target.value))}
            />
          </label>
          <div className="row" aria-label="Быстрый выбор текущей клетки">
            {[6, 8, 10, 23, 54, 68, 72].map((cell) => (
              <button key={cell} type="button" className="button button--ghost" onClick={() => setCurrent(cell)} aria-pressed={current === cell}>
                {cell}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="lila-preview-grid" aria-label="Варианты поля Лилы">
        <PreviewCard title="Full" note="Компьютерный вариант: номера и короткие названия, длинные — по наведению или фокусу.">
          <Board current={current} trail={trail} variant="full" />
        </PreviewCard>
        <PreviewCard title="Compact" note="Телефон 375 px: только номера, без горизонтальной прокрутки.">
          <Board current={current} trail={trail} variant="compact" />
        </PreviewCard>
        <PreviewCard title="Locator" note="Мини-поле для страниц клеток: показывает, где находится выбранная клетка.">
          <Board current={current} trail={trail} variant="locator" />
        </PreviewCard>
      </section>
    </div>
  );
}

function PreviewCard({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <article className="card lila-preview-card">
      <div className="stack">
        <div>
          <h2>{title}</h2>
          <p className="muted">{note}</p>
        </div>
        {children}
      </div>
    </article>
  );
}

