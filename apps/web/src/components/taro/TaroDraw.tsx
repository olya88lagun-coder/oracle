"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
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

// Страница карты дня целиком: слева вступление (children), справа сцена с рубашками или вытянутой картой, ниже трактовка
export function TaroDraw({ cards, children }: { cards: readonly DrawCard[]; children: ReactNode }) {
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

  function pick() {
    if (drawn) return;
    const card = cards[pickCardIndex(cards.length)]!;
    writeDayCard(storage(), new Date(), card.slug);
    setDrawn(card);
    reachGoal("taro_draw");
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  return (
    <div className="taro-day">
      <section className="taro-day-hero" aria-labelledby="taro-day-title">
        <div className="taro-day-copy">{children}</div>
        <div className="taro-scene">
          <div className="taro-orbit" aria-hidden="true" />
          {drawn ? (
            <article className={again ? "taro-picked" : "taro-picked taro-picked--fresh"}>
              <Image src={drawn.image} alt={`Карта Таро ${drawn.name}`} width={277} height={480} unoptimized />
              <div className="taro-picked__meta">
                <p className="eyebrow">{drawn.suitLabel}</p>
                <h2 ref={headingRef} tabIndex={-1}>
                  {drawn.name}
                </h2>
                <p role="status">{again ? "Ваша карта дня уже вытянута." : "Ваша карта дня."}</p>
              </div>
            </article>
          ) : (
            <div className="taro-choose">
              <p id="taro-pick-label">Выберите одну из трёх карт.</p>
              <div className="taro-picks" role="group" aria-labelledby="taro-pick-label">
                {SLOTS.map((index) => (
                  <button key={index} type="button" className="taro-pick" aria-label={`Карта ${index + 1}`} disabled={!ready} onClick={pick}>
                    <TaroBack />
                  </button>
                ))}
              </div>
              <p className="muted">Выбор карты происходит в вашем браузере.</p>
            </div>
          )}
        </div>
      </section>
      {drawn && (
        <section className="taro-reading" aria-label="Трактовка карты">
          <article className="taro-panel">
            <h2>Как прожить день</h2>
            <p>{drawn.day}</p>
            <p>
              <strong>Действие на сегодня: </strong>
              {drawn.action}
            </p>
            <div className="row taro-actions">
              <Link className="button" href={drawn.path}>
                Значение карты
              </Link>
              <TaroShare card={drawn} />
            </div>
          </article>
          <article className="taro-panel taro-panel--question">
            <h2>Вопрос для себя</h2>
            <p>{drawn.question}</p>
          </article>
        </section>
      )}
    </div>
  );
}
