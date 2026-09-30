"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { pickCardIndex, readDayCard, writeDayCard } from "@/lib/taro-day";
import { TaroBack } from "./TaroBack";
import { TaroShare } from "./TaroShare";

export type DrawCard = { slug: string; name: string; suitLabel: string; image: string; path: string; day: string; action: string; question: string };

// Сколько рубашек показываем на выбор; карта под любой из них выбирается случайно из всей колоды
export const TARO_PICK_COUNT = 3;
const SLOTS = Array.from({ length: TARO_PICK_COUNT }, (_, index) => index);

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

export function TaroDraw({ cards }: { cards: readonly DrawCard[] }) {
  const [drawn, setDrawn] = useState<DrawCard | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
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

  function pick(index: number) {
    if (drawn) return;
    const card = cards[pickCardIndex(cards.length)]!;
    writeDayCard(storage(), new Date(), card.slug);
    setSlot(index);
    setDrawn(card);
    reachGoal("taro_draw");
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  return (
    <div className="stack taro-draw">
      {!again && (
        <>
          <p id="taro-pick-label">{drawn ? "Ваша карта дня выбрана." : "Выберите одну из трёх карт."}</p>
          <div className="taro-picks" role="group" aria-labelledby="taro-pick-label">
            {SLOTS.map((index) =>
              drawn && slot === index ? (
                <Image key={index} className="taro-draw__card taro-picks__open" src={drawn.image} alt={`Карта Таро ${drawn.name}`} width={277} height={480} unoptimized />
              ) : (
                <button key={index} type="button" className="taro-pick" aria-label={`Карта ${index + 1}`} disabled={!ready || drawn !== null} onClick={() => pick(index)}>
                  <TaroBack />
                </button>
              ),
            )}
          </div>
          {!drawn && <p className="muted">Выбор карты происходит в вашем браузере.</p>}
        </>
      )}
      {drawn && (
        <div className="stack taro-draw--drawn">
          <p role="status" className="muted">
            {again ? "Ваша карта дня уже вытянута." : "Ваша карта дня."}
          </p>
          {again && <Image className="taro-draw__card" src={drawn.image} alt={`Карта Таро ${drawn.name}`} width={277} height={480} unoptimized />}
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
      )}
    </div>
  );
}
