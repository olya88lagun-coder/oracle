"use client";

import { useEffect, useRef, type ReactNode } from "react";

// На сервере и с 720 px карточка раскрыта. На телефоне чужие дни сворачиваются до «Вопрос и действие»; сегодняшний остаётся открытым.
export function WeekdayCardFold({ open, children }: { open: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const media = window.matchMedia("(min-width: 720px)");
    const sync = () => {
      node.open = open || media.matches;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [open]);

  return (
    <details ref={ref} className="weekday-card__fold" open>
      <summary className="weekday-card__fold-summary">Вопрос и действие</summary>
      <div className="weekday-card__fold-body">{children}</div>
    </details>
  );
}
