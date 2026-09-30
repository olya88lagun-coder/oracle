import { arcanumBySlug } from "@oracle/content";
import { TAROT_DECK, TAROT_SECTION_TITLES, TAROT_SUIT_LABELS, type TarotCard } from "@oracle/content/tarot";
import Image from "next/image";
import Link from "next/link";
import { arcanumPath } from "@/lib/arcana-paths";
import { TARO_AUTHOR_CREDIT, TARO_DAY_PATH, TARO_PATH, taroCardImage, taroCardPath } from "@/lib/taro-paths";

const neighbour = (card: TarotCard, shift: number) => {
  const suit = TAROT_DECK.filter((item) => item.suit === card.suit);
  const index = suit.findIndex((item) => item.slug === card.slug);
  return suit[(index + shift + suit.length) % suit.length]!;
};

const Paragraphs = ({ items }: { items: readonly string[] }) => (
  <>
    {items.map((paragraph) => (
      <p key={paragraph}>{paragraph}</p>
    ))}
  </>
);

const Bullets = ({ items }: { items: readonly string[] }) => (
  <ul>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

export function TaroCardView({ card }: { card: TarotCard }) {
  const matrix = card.suit === "major" ? arcanumBySlug(card.slug) : undefined;
  const previous = neighbour(card, -1);
  const next = neighbour(card, 1);
  const T = TAROT_SECTION_TITLES;
  return (
    <main className="page page--wide stack taro-page">
      <nav aria-label="Навигация" className="muted">
        <Link className="touch-link" href={TARO_PATH}>
          Таро и карта дня
        </Link>{" "}
        › {TAROT_SUIT_LABELS[card.suit]}
      </nav>

      <header className="taro-hero">
        <Image className="taro-hero__art" src={taroCardImage(card)} alt={`Карта Таро ${card.name}`} width={554} height={960} priority unoptimized />
        <div className="stack taro-hero__text">
          <p className="eyebrow eyebrow--line">{card.suit === "major" ? `Старший аркан ${card.rank}` : TAROT_SUIT_LABELS[card.suit]}</p>
          <h1 className="display">{card.name}</h1>
          <ul className="row arcanum-hero__keywords" aria-label="Ключевые слова">
            {card.keywords.map((keyword) => (
              <li key={keyword} className="tag">
                {keyword}
              </li>
            ))}
          </ul>
          {matrix && (
            <p>
              В матрице судьбы этот аркан имеет номер {matrix.number}. <Link href={arcanumPath(matrix)}>Аркан {matrix.number} в матрице</Link>
            </p>
          )}
          <p className="muted">{TARO_AUTHOR_CREDIT}</p>
        </div>
      </header>

      <section className="stack" aria-labelledby="taro-essence">
        <h2 id="taro-essence">{T.essence}</h2>
        <Paragraphs items={card.essence} />
      </section>
      <div className="arcanum-poles arcanum-life">
        <section className="card stack" aria-labelledby="taro-love">
          <h2 id="taro-love">{T.love}</h2>
          <Paragraphs items={card.love} />
        </section>
        <section className="card stack" aria-labelledby="taro-money">
          <h2 id="taro-money">{T.money}</h2>
          <Paragraphs items={card.money} />
        </section>
      </div>
      <div className="arcanum-poles">
        <section className="card stack" aria-labelledby="taro-resource">
          <h2 id="taro-resource">{T.resource}</h2>
          <Bullets items={card.resource} />
        </section>
        <section className="card stack" aria-labelledby="taro-distortion">
          <h2 id="taro-distortion">{T.distortion}</h2>
          <Bullets items={card.distortion} />
        </section>
      </div>
      <section className="stack" aria-labelledby="taro-day">
        <h2 id="taro-day">{T.day}</h2>
        <Paragraphs items={card.day} />
      </section>
      <div className="arcanum-poles">
        <section className="card stack" aria-labelledby="taro-action">
          <h2 id="taro-action">{T.action}</h2>
          <p>{card.action}</p>
        </section>
        <section className="card stack" aria-labelledby="taro-question">
          <h2 id="taro-question">{T.question}</h2>
          <p className="arcanum-question">{card.question}</p>
        </section>
      </div>

      <p>
        <Link className="button button--lavender" href={TARO_DAY_PATH}>
          Вытянуть карту дня
        </Link>
      </p>
      <nav className="row arcanum-neighbours" aria-label="Соседние карты масти">
        <Link className="button button--ghost" href={taroCardPath(previous)}>
          ← {previous.name}
        </Link>
        <Link className="button button--ghost" href={taroCardPath(next)}>
          {next.name} →
        </Link>
      </nav>
    </main>
  );
}
