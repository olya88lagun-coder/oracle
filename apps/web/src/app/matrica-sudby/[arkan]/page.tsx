import { ARCANA, arcanumByNumber, SECTION_TITLES, type Arcanum } from "@oracle/content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArcanaIndex } from "@/components/ArcanaIndex";
import { ArcanumSection } from "@/components/ArcanumSection";
import { ArcanumSectionsExpander } from "@/components/ArcanumSectionsExpander";
import { CalculatorLink } from "@/components/CalculatorLink";
import { DetailPager } from "@/components/detail/DetailPager";
import { DetailToc } from "@/components/detail/DetailToc";
import { ExpandAll } from "@/components/detail/ExpandAll";
import { ImageZoom } from "@/components/detail/ImageZoom";
import { arcanumFromParam, arcanumImage, arcanumJsonLd, arcanumParam, arcanumPath, MATRIX_PATH, shortDescription } from "@/lib/arcana-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

type Params = { params: Promise<{ arkan: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ARCANA.map((arcanum) => ({ arkan: arcanumParam(arcanum) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const arcanum = arcanumFromParam((await params).arkan);
  if (!arcanum) return {};
  return publicMetadata({
    title: `${arcanum.number} аркан ${arcanum.name} в матрице судьбы: в плюсе и в минусе`,
    description: shortDescription(`Число ${arcanum.number} в матрице судьбы — аркан ${arcanum.name}. ${arcanum.essence[0] ?? ""}`),
    path: arcanumPath(arcanum),
    image: { url: arcanumImage(arcanum), alt: `Аркан ${arcanum.number} «${arcanum.name}»` },
  });
}

// Люди ищут «6 в матрице судьбы» без слова «аркан»: отвечаем на это прямо, тексты берём из разделов аркана
const numberFaq = (arcanum: Arcanum) => [
  { question: `Что значит число ${arcanum.number} в матрице судьбы?`, answer: shortDescription(`Число ${arcanum.number} в матрице судьбы — это аркан «${arcanum.name}». ${arcanum.essence[0] ?? ""}`) },
  { question: `Что значит ${arcanum.number} в личности?`, answer: shortDescription(arcanum.personality[0] ?? "") },
  { question: `Что значит ${arcanum.number} в центре матрицы?`, answer: shortDescription(arcanum.center[0] ?? "") },
];

const neighbour = (number: number) => arcanumByNumber(((number - 1 + ARCANA.length) % ARCANA.length) + 1);

type SectionKey = "essence" | "personality" | "center" | "task" | "love" | "money" | "resource" | "distortion" | "action" | "question";
// Порядок разделов страницы: те же десять, что и прежде
const SECTIONS: readonly SectionKey[] = ["essence", "personality", "center", "task", "love", "money", "resource", "distortion", "action", "question"];
const sectionId = (key: SectionKey) => `razdel-${key}`;
// На странице — словами из поисковых запросов («аркан в плюсе / в минусе»). Общие SECTION_TITLES не меняем: их читает ИИ-разбор
const PAGE_SECTION_TITLES: Readonly<Record<SectionKey, string>> = { ...SECTION_TITLES, resource: "В плюсе: ресурс", distortion: "В минусе: перекос" };

function SectionBody({ arcanum, sectionKey }: { arcanum: Arcanum; sectionKey: SectionKey }) {
  if (sectionKey === "resource" || sectionKey === "distortion") {
    return (
      <ul>
        {arcanum[sectionKey].map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (sectionKey === "action") return <p>{arcanum.action}</p>;
  if (sectionKey === "question") return <p className="detail-question">{arcanum.question}</p>;
  return (
    <>
      {arcanum[sectionKey].map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </>
  );
}

export default async function ArcanumPage({ params }: Params) {
  const arcanum = arcanumFromParam((await params).arkan);
  if (!arcanum) notFound();
  const previous = neighbour(arcanum.number - 1);
  const next = neighbour(arcanum.number + 1);
  const jsonLd = JSON.stringify(arcanumJsonLd(arcanum, SITE_URL)).replace(/</g, "\\u003c");
  const faq = numberFaq(arcanum);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
  const toc = SECTIONS.map((key) => ({ id: sectionId(key), title: PAGE_SECTION_TITLES[key] }));

  return (
    <main className="detail-page arcanum-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }} />
      <nav aria-label="Навигация" className="detail-crumbs">
        <Link className="touch-link" href={MATRIX_PATH}>
          Матрица судьбы
        </Link>{" "}
        › Аркан {arcanum.number}
      </nav>

      <div className="detail-grid">
        <aside className="detail-side">
          <figure className="detail-media">
            <ImageZoom src={arcanumImage(arcanum, "card")} fullSrc={arcanumImage(arcanum)} alt={`Аркан ${arcanum.number} «${arcanum.name}»`} width={440} height={440} priority />
            <figcaption>
              Аркан {arcanum.number} · {arcanum.name}
            </figcaption>
          </figure>
          <DetailToc items={toc} />
        </aside>

        <div className="detail-main">
          <header className="detail-head">
            <h1 className={`display detail-title${arcanum.name.length > 14 ? " detail-title--long" : ""}`}>{arcanum.name}</h1>
            <ul className="detail-tags" aria-label="Ключевые слова">
              {arcanum.keywords.map((keyword) => (
                <li key={keyword}>{keyword}</li>
              ))}
            </ul>
            <p className="detail-note">
              Число {arcanum.number} в матрице судьбы — это аркан {arcanum.name}. Оно может стоять в личности, в центре, в задаче или на линиях
              матрицы; ниже — значение для каждой позиции.
            </p>
            <div className="detail-actions">
              <CalculatorLink className="button button--lavender">Рассчитать свою матрицу</CalculatorLink>
              <a className="matrix-link" href="#arcana-index">
                Все арканы
              </a>
            </div>
          </header>

          <ExpandAll selector="details.arcanum-section" />
          <div className="detail-sections">
            {SECTIONS.map((key) => (
              <ArcanumSection key={key} id={sectionId(key)} title={PAGE_SECTION_TITLES[key]} className="detail-section" defaultOpen={key === "essence"}>
                <SectionBody arcanum={arcanum} sectionKey={key} />
              </ArcanumSection>
            ))}
          </div>

          <section className="stack detail-faq" aria-labelledby="arcanum-faq">
            <h2 id="arcanum-faq">Частые вопросы о числе {arcanum.number}</h2>
            {faq.map((item) => (
              <div key={item.question} className="stack">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </section>
        </div>
      </div>

      <DetailPager
        label="Соседние арканы"
        previous={{ href: arcanumPath(previous), label: `${previous.number} · ${previous.name}`, image: arcanumImage(previous, "thumb"), imageSize: 64 }}
        next={{ href: arcanumPath(next), label: `${next.number} · ${next.name}`, image: arcanumImage(next, "thumb"), imageSize: 64 }}
      />

      <div id="arcana-index" className="detail-index">
        <ArcanaIndex current={arcanum.number} />
      </div>
      <ArcanumSectionsExpander />
    </main>
  );
}
