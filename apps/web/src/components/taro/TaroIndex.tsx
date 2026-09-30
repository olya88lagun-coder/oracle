import { TAROT_DECK, TAROT_SUIT_LABELS, type TarotSuit } from "@oracle/content/tarot";
import Image from "next/image";
import Link from "next/link";
import { taroCardImage, taroCardPath } from "@/lib/taro-paths";

const SUITS: readonly TarotSuit[] = ["major", "wands", "cups", "swords", "pentacles"];

// Все 78 карт по мастям: миниатюры со ссылками на страницы значений
export function TaroIndex() {
  return (
    <div className="stack">
      {SUITS.map((suit) => (
        <section key={suit} className="stack" aria-labelledby={`taro-suit-${suit}`}>
          <h2 id={`taro-suit-${suit}`}>{TAROT_SUIT_LABELS[suit]}</h2>
          <ul className="taro-grid">
            {TAROT_DECK.filter((card) => card.suit === suit).map((card) => (
              <li key={card.slug}>
                <Link href={taroCardPath(card)} className="taro-grid__item">
                  <Image src={taroCardImage(card, "thumb")} alt="" width={92} height={160} unoptimized />
                  <span>{card.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
