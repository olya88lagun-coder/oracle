import { ARCANA, arcanumByNumber, type Arcanum } from "@oracle/content";
import { yearTextByNumber, type YearText } from "@oracle/content/year";
import { ARCANA_YEAR } from "@oracle/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArcanaIndex } from "@/components/ArcanaIndex";
import { ArcanumSection } from "@/components/ArcanumSection";
import { ArcanumSectionsExpander } from "@/components/ArcanumSectionsExpander";
import { DetailPager } from "@/components/detail/DetailPager";
import { DetailToc } from "@/components/detail/DetailToc";
import { ExpandAll } from "@/components/detail/ExpandAll";
import { ImageZoom } from "@/components/detail/ImageZoom";
import { arcanumFromParam, arcanumImage, arcanumParam, arcanumPath, shortDescription } from "@/lib/arcana-paths";
import { breadcrumbJsonLd, jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { YEAR_PATH, yearArcanumPath } from "@/lib/year-arcana";
import { yearAdvice } from "@/lib/year-arcana-advice";

type Params = { params: Promise<{ arkan: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ARCANA.map((arcanum) => ({ arkan: arcanumParam(arcanum) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const arcanum = arcanumFromParam((await params).arkan);
  if (!arcanum) return {};
  return publicMetadata({
    title: `${arcanum.number} аркан на год: ${arcanum.name} — значение на ${ARCANA_YEAR} год`,
    description: shortDescription(yearTextByNumber(arcanum.number).theme),
    path: yearArcanumPath(arcanum),
    image: { url: arcanumImage(arcanum), alt: `Аркан ${arcanum.number} «${arcanum.name}»` },
  });
}

const neighbour = (number: number) => arcanumByNumber(((number - 1 + ARCANA.length) % ARCANA.length) + 1);

type SectionKey = "supports" | "attention" | "love" | "money" | "advice" | "question";
const SECTIONS: readonly SectionKey[] = ["supports", "attention", "love", "money", "advice", "question"];
const TITLES: Readonly<Record<SectionKey, string>> = {
  supports: "В плюсе: что поддерживает",
  attention: "В минусе: на что обратить внимание",
  love: "В отношениях",
  money: "В деле и деньгах",
  advice: "Три шага",
  question: "Вопрос года",
};
const sectionId = (key: SectionKey) => `razdel-${key}`;

function SectionBody({ arcanum, text, sectionKey }: { arcanum: Arcanum; text: YearText; sectionKey: SectionKey }) {
  if (sectionKey === "question") return <p className="detail-question">{text.question}</p>;
  if (sectionKey === "advice") {
    return (
      <ul>
        {yearAdvice(arcanum).map((item) => (
          <li key={item.title}>
            <strong>{item.title}.</strong> {item.text}
          </li>
        ))}
      </ul>
    );
  }
  return <p>{text[sectionKey]}</p>;
}

const pageJsonLd = (arcanum: Arcanum, text: YearText) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: `Аркан ${arcanum.number} «${arcanum.name}» как аркан года`,
  description: shortDescription(text.theme),
  inLanguage: "ru",
  mainEntityOfPage: `${SITE_URL}${yearArcanumPath(arcanum)}`,
  image: `${SITE_URL}${arcanumImage(arcanum)}`,
});

export default async function YearArcanumPage({ params }: Params) {
  const arcanum = arcanumFromParam((await params).arkan);
  if (!arcanum) notFound();
  const text = yearTextByNumber(arcanum.number);
  const previous = neighbour(arcanum.number - 1);
  const next = neighbour(arcanum.number + 1);
  const toc = SECTIONS.map((key) => ({ id: sectionId(key), title: TITLES[key] }));
  const crumbs = breadcrumbJsonLd([
    { name: `Аркан ${ARCANA_YEAR}`, path: YEAR_PATH },
    { name: `Аркан ${arcanum.number} на год`, path: yearArcanumPath(arcanum) },
  ]);

  return (
    <main className="detail-page arcanum-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(pageJsonLd(arcanum, text)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }} />
      <nav aria-label="Навигация" className="detail-crumbs">
        <Link className="touch-link" href={YEAR_PATH}>
          Аркан {ARCANA_YEAR}
        </Link>{" "}
        › Аркан {arcanum.number}
      </nav>

      <div className="detail-grid">
        <aside className="detail-side">
          <figure className="detail-media">
            <ImageZoom src={arcanumImage(arcanum, "card")} fullSrc={arcanumImage(arcanum)} alt={`Аркан ${arcanum.number} «${arcanum.name}»`} width={440} height={440} priority />
            <figcaption>
              Аркан года {arcanum.number} · {arcanum.name}
            </figcaption>
          </figure>
          <DetailToc items={toc} />
        </aside>

        <div className="detail-main">
          <header className="detail-head stack">
            <h1 className={`display detail-title${arcanum.name.length > 14 ? " detail-title--long" : ""}`}>
              {arcanum.name} <span>как аркан года</span>
            </h1>
            <p className="lead">{text.theme}</p>
            <div className="detail-actions">
              <Link className="button button--lavender" href={YEAR_PATH}>
                Рассчитать свой аркан на {ARCANA_YEAR} год
              </Link>
              <a className="matrix-link" href="#arcana-index">
                Все арканы года
              </a>
            </div>
          </header>

          <ExpandAll selector="details.arcanum-section" />
          <div className="detail-sections">
            {SECTIONS.map((key) => (
              <ArcanumSection key={key} id={sectionId(key)} title={TITLES[key]} className="detail-section" defaultOpen={key === "supports"}>
                <SectionBody arcanum={arcanum} text={text} sectionKey={key} />
              </ArcanumSection>
            ))}
          </div>

          <section className="stack" aria-labelledby="year-arcanum-how">
            <h2 id="year-arcanum-how">Как считается аркан года</h2>
            <p>
              Мы берём центр вашей матрицы судьбы и число года: день рождения целиком, месяц и сумму цифр года ({ARCANA_YEAR} даёт 11). Числа больше
              22 сворачиваются сложением цифр, затем центр и число года складываются и снова сворачиваются до 1–22. Например, 14.03.1992: центр 13;
              14 + 3 + 11 = 28, а 2 + 8 = 10; 13 + 10 = 23, а 2 + 3 = 5 — аркан 5. Это календарный год с 1 января по 31 декабря, а не возрастная
              линия матрицы.
            </p>
            <p>
              Посчитать свой аркан можно в <Link href={YEAR_PATH}>калькуляторе аркана года</Link>. Значение этого аркана для одного человека —
              в личности, в центре, в отношениях и в деньгах — на странице{" "}
              <Link href={arcanumPath(arcanum)}>
                аркана {arcanum.number} «{arcanum.name}» в матрице судьбы
              </Link>
              .
            </p>
            <p className="muted">Аркан года — тема для размышления, а не прогноз событий. Решения о здоровье, деньгах и отношениях опирайте на факты и свою ситуацию.</p>
          </section>
        </div>
      </div>

      <DetailPager
        label="Соседние арканы года"
        previous={{ href: yearArcanumPath(previous), label: `${previous.number} · ${previous.name}`, image: arcanumImage(previous, "thumb"), imageSize: 64 }}
        next={{ href: yearArcanumPath(next), label: `${next.number} · ${next.name}`, image: arcanumImage(next, "thumb"), imageSize: 64 }}
      />

      <div id="arcana-index" className="detail-index">
        <ArcanaIndex current={arcanum.number} title="Все 22 аркана года" hub={{ href: YEAR_PATH, label: `Рассчитать аркан на ${ARCANA_YEAR} год` }} pathOf={yearArcanumPath} />
      </div>
      <ArcanumSectionsExpander />
    </main>
  );
}
