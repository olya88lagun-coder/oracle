"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { pickCardIndex, readDayCard, writeDayCard } from "@/lib/taro-day";
import { TaroBack } from "./TaroBack";
import { TaroShare } from "./TaroShare";

export type DrawCard = { slug: string; name: string; suitLabel: string; image: string; path: string; day: string; action: string; question: string };

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export function TaroDraw({ cards }: { cards: readonly DrawCard[] }) {
  const [drawn, setDrawn] = useState<DrawCard | null>(null);
  const [again, setAgain] = useState(false);
  const [ready, setReady] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Карта дня уже вытянута — показываем её без нового выбора
  useEffect(() => {
    const saved = readDayCard(storage(), new Date());
    const card = cards.find((item) => item.slug === saved);
    if (card) {
      setDrawn(card);
      setAgain(true);
    }
    setReady(true);
  }, [cards]);

  function draw() {
    const card = cards[pickCardIndex(cards.length)]!;
    writeDayCard(storage(), new Date(), card.slug);
    setDrawn(card);
    reachGoal("taro_draw");
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  if (!drawn) {
    return (
      <div className="stack taro-draw">
        <TaroBack />
        <button type="button" className="button button--lavender" onClick={draw} disabled={!ready}>
          Вытянуть карту дня
        </button>
        <p className="muted">Выбор карты происходит в вашем браузере.</p>
      </div>
    );
  }
  return (
    <div className="stack taro-draw taro-draw--drawn">
      <p role="status" className="muted">
        {again ? "Ваша карта дня уже вытянута." : "Ваша карта дня."}
      </p>
      <Image className="taro-draw__card" src={drawn.image} alt={`Карта Таро ${drawn.name}`} width={277} height={480} unoptimized />
      <p className="eyebrow">{drawn.suitLabel}</p>
      <h2 ref={headingRef} tabIndex={-1}>
        {drawn.name}
      </h2>
      <p>{drawn.day}</p>
      <p>
        <strong>Действие на сегодня: </strong>
        {drawn.action}
      </p>
      <p className="lila-turn__question">
        <strong>Вопрос для себя:</strong> {drawn.question}
      </p>
      <div className="row taro-actions">
        <Link className="button button--ghost" href={drawn.path}>
          Значение карты
        </Link>
        <TaroShare card={drawn} />
      </div>
    </div>
  );
}
