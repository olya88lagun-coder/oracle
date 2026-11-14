"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { reachGoal } from "@/lib/analytics";
import { addSeenCard, formatUntilNextCard, msUntilNextMoscowDay, pickCardIndex, readDayCard, readSeenCards, writeDayCard } from "@/lib/taro-day";
import { PosterButton } from "@/components/PosterButton";
import { TaroBack } from "./TaroBack";
import { TaroShare } from "./TaroShare";

export type DrawCard = { slug: string; name: string; suitLabel: string; image: string; thumb: string; large: string; path: string; day: string; action: string; question: string };

// Сколько рубашек показываем на выбор; карта под любой из них выбирается случайно из всей колоды
export const TARO_PICK_COUNT = 3;
const SLOTS = Array.from({ length: TARO_PICK_COUNT }, (_, index) => index);
// Сколько длится переворот выбранной карты, прежде чем откроется трактовка (при «меньше движения» её нет)
const FLIP_MS = 1100;

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

const prefersReducedMotion = (): boolean => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Страница карты дня целиком: слева вступление (children), справа сцена с рубашками или вытянутой картой, ниже трактовка и колода встреченных карт
export function TaroDraw({ cards, children }: { cards: readonly DrawCard[]; children: ReactNode }) {
  const [drawn, setDrawn] = useState<DrawCard | null>(null);
  const [again, setAgain] = useState(false);
  const [ready, setReady] = useState(false);
  // Выбранная рубашка переворачивается, остальные гаснут; потом открывается трактовка
  const [choice, setChoice] = useState<{ index: number; card: DrawCard } | null>(null);
  const [seen, setSeen] = useState<readonly string[]>([]);
  const [untilNext, setUntilNext] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Карта дня уже вытянута — показываем её без нового выбора
  useEffect(() => {
    const saved = readDayCard(storage(), new Date());
    const card = cards.find((item) => item.slug === saved);
    if (card) {
      setDrawn(card);
      setAgain(true);
      setSeen(addSeenCard(storage(), card.slug));
    } else {
      setSeen(readSeenCards(storage()));
    }
    setReady(true);
  }, [cards]);

  // Переворот закончился — открываем трактовку и переводим фокус на название карты
  useEffect(() => {
    if (!choice) return;
    const timer = setTimeout(() => {
      setDrawn(choice.card);
      requestAnimationFrame(() => headingRef.current?.focus());
    }, FLIP_MS);
    return () => clearTimeout(timer);
  }, [choice]);

  // «Следующая карта откроется через …»: считаем до полуночи по Москве и обновляем раз в минуту
  useEffect(() => {
    if (!drawn) return;
    const tick = () => setUntilNext(msUntilNextMoscowDay(new Date()));
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, [drawn]);

  function pick(index: number) {
    if (drawn || choice) return;
    const card = cards[pickCardIndex(cards.length)]!;
    writeDayCard(storage(), new Date(), card.slug);
    setSeen(addSeenCard(storage(), card.slug));
    reachGoal("taro_draw");
    if (prefersReducedMotion()) {
      setDrawn(card);
      requestAnimationFrame(() => headingRef.current?.focus());
      return;
    }
    setChoice({ index, card });
  }

  // Пока карта переворачивается, в колоде её ещё нет — иначе она показалась бы раньше, чем открылась
  const shown = useMemo(() => (choice && !drawn ? seen.filter((slug) => slug !== choice.card.slug) : seen), [seen, choice, drawn]);
  const seenSet = useMemo(() => new Set(shown), [shown]);

  return (
    <div className="taro-day">
      <section className="taro-day-hero" aria-labelledby="taro-day-title">
        <div className="taro-day-copy">{children}</div>
        <div className="taro-scene">
          <div className="taro-orbit" aria-hidden="true" />
          {drawn ? (
            <article className={again || choice ? "taro-picked" : "taro-picked taro-picked--fresh"}>
              <Image src={drawn.image} alt={`Карта Таро ${drawn.name}`} width={277} height={480} unoptimized />
              <div className="taro-picked__meta">
                <p className="eyebrow">{drawn.suitLabel}</p>
                <h2 ref={headingRef} tabIndex={-1}>
                  {drawn.name}
                </h2>
                <p role="status">{again ? "Ваша карта дня уже вытянута." : "Ваша карта дня."}</p>
                {untilNext !== null && <p className="taro-next">Следующая карта откроется через {formatUntilNextCard(untilNext)}.</p>}
              </div>
            </article>
          ) : (
            <div className="taro-choose">
              <p id="taro-pick-label">Выберите одну из трёх карт.</p>
              <div className="taro-picks" role="group" aria-labelledby="taro-pick-label">
                {SLOTS.map((index) => (
                  <button
                    key={index}
                    type="button"
                    className="taro-pick"
                    data-flip={choice ? (choice.index === index ? "chosen" : "gone") : undefined}
                    aria-label={`Карта ${index + 1}`}
                    aria-disabled={choice ? true : undefined}
                    disabled={!ready}
                    onClick={() => pick(index)}
                  >
                    {choice?.index === index ? (
                      <span className="taro-flip">
                        <span className="taro-flip__face">
                          <TaroBack />
                        </span>
                        <span className="taro-flip__face taro-flip__face--front">
                          <Image src={choice.card.image} alt="" width={277} height={480} unoptimized />
                        </span>
                      </span>
                    ) : (
                      <TaroBack />
                    )}
                  </button>
                ))}
              </div>
              <p className="muted taro-choose__hint">Нажмите на карту · выбор остаётся в браузере</p>
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
              <PosterButton
                spec={{
                  eyebrow: "Карта дня",
                  title: drawn.name,
                  cards: [{ image: drawn.large, caption: drawn.name }],
                  textLabel: "Вопрос для себя",
                  text: drawn.question,
                  footer: "ТВОЙ ОРАКУЛ · TVOY-ORAKUL.RU",
                  fileName: `karta-dnya-${drawn.slug}`,
                }}
              />
            </div>
          </article>
          <article className="taro-panel taro-panel--question">
            <h2>Вопрос для себя</h2>
            <p>{drawn.question}</p>
          </article>
        </section>
      )}
      {shown.length > 0 && (
        <section className="taro-deck" aria-labelledby="taro-deck-title">
          <h2 id="taro-deck-title">Ваша колода</h2>
          <p className="taro-deck__count">
            Встречено карт: {shown.length} из {cards.length}. Остальные откроются в другие дни.
          </p>
          <ul className="taro-deck__grid">
            {cards.map((card) =>
              seenSet.has(card.slug) ? (
                <li key={card.slug} className={drawn?.slug === card.slug ? "taro-deck__cell taro-deck__cell--seen taro-deck__cell--today" : "taro-deck__cell taro-deck__cell--seen"}>
                  <Image src={card.thumb} alt={card.name} title={card.name} width={80} height={140} unoptimized />
                </li>
              ) : (
                <li key={card.slug} className="taro-deck__cell" aria-hidden="true" />
              ),
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
