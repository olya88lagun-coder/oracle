import { arcanumBySlug } from "@oracle/content";
import { TAROT_DECK, TAROT_SECTION_TITLES, TAROT_SUIT_LABELS, type TarotCard } from "@oracle/content/tarot";
import Link from "next/link";
import { DetailPager } from "@/components/detail/DetailPager";
import { DetailToc } from "@/components/detail/DetailToc";
import { ImageZoom } from "@/components/detail/ImageZoom";
import { arcanumPath } from "@/lib/arcana-paths";
import { TARO_AUTHOR_CREDIT, TARO_DAY_PATH, TARO_PATH, taroCardImage, taroCardPath } from "@/lib/taro-paths";

// Соседи берутся внутри масти и замыкаются по кругу
const neighbour = (card: TarotCard, shift: number) => {
  const suit = TAROT_DECK.filter((item) => item.suit === card.suit);
  const index = suit.findIndex((item) => item.slug === card.slug);
  return suit[(index + shift + suit.length) % suit.length]!;
};

type SectionKey = keyof typeof TAROT_SECTION_TITLES;
const SECTIONS: readonly SectionKey[] = ["essence", "love", "money", "resource", "distortion", "day", "action", "question"];
const sectionId = (key: SectionKey) => `razdel-${key}`;

function SectionBody({ card, sectionKey }: { card: TarotCard; sectionKey: SectionKey }) {
  if (sectionKey === "resource" || sectionKey === "distortion") {
    return (
      <ul>
        {card[sectionKey].map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (sectionKey === "action") return <p>{card.action}</p>;
  if (sectionKey === "question") return <p className="detail-question">{card.question}</p>;
  return (
    <>
      {card[sectionKey].map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </>
  );
}

export function TaroCardView({ card }: { card: TarotCard }) {
  const matrix = card.suit === "major" ? arcanumBySlug(card.slug) : undefined;
  const previous = neighbour(card, -1);
  const next = neighbour(card, 1);
  const alt = `Карта Таро ${card.name}`;
  const toc = SECTIONS.map((key) => ({ id: sectionId(key), title: TAROT_SECTION_TITLES[key] }));
  return (
    <main className="detail-page taro-page">
      <nav aria-label="Навигация" className="detail-crumbs">
        <Link className="touch-link" href={TARO_PATH}>
          Таро и карта дня
        </Link>{" "}
        › {TAROT_SUIT_LABELS[card.suit]}
      </nav>

      <div className="detail-grid">
        <aside className="detail-side">
          <figure className="detail-media detail-media--card">
            <ImageZoom src={taroCardImage(card, "card")} fullSrc={taroCardImage(card)} alt={alt} width={277} height={480} priority />
            <figcaption>{TARO_AUTHOR_CREDIT}</figcaption>
          </figure>
          <DetailToc items={toc} />
        </aside>

        <div className="detail-main">
          <header className="detail-head">
            <p className="detail-eyebrow">{card.suit === "major" ? `Старший аркан ${card.rank}` : TAROT_SUIT_LABELS[card.suit]}</p>
            <h1 className={`display detail-title${card.name.length > 14 ? " detail-title--long" : ""}`}>{card.name}</h1>
            <ul className="detail-tags" aria-label="Ключевые слова">
              {card.keywords.map((keyword) => (
                <li key={keyword}>{keyword}</li>
              ))}
            </ul>
            {matrix && (
              <p className="detail-note">
                В матрице судьбы этот аркан имеет номер {matrix.number}. <Link href={arcanumPath(matrix)}>Аркан {matrix.number} в матрице</Link>
              </p>
            )}
            <div className="detail-actions">
              <Link className="button button--lavender" href={TARO_DAY_PATH}>
                Вытянуть карту дня
              </Link>
              <Link className="matrix-link" href={`${TARO_PATH}#znacheniya`}>
                Все карты
              </Link>
            </div>
          </header>

          <div className="detail-sections">
            {SECTIONS.map((key) => (
              <section key={key} id={sectionId(key)} className="detail-section" aria-labelledby={`${sectionId(key)}-title`}>
                <h2 id={`${sectionId(key)}-title`}>{TAROT_SECTION_TITLES[key]}</h2>
                <SectionBody card={card} sectionKey={key} />
              </section>
            ))}
          </div>
        </div>
      </div>

      <DetailPager
        label="Соседние карты масти"
        previous={{ href: taroCardPath(previous), label: previous.name, image: taroCardImage(previous, "thumb"), imageSize: 64 }}
        next={{ href: taroCardPath(next), label: next.name, image: taroCardImage(next, "thumb"), imageSize: 64 }}
      />
    </main>
  );
}
