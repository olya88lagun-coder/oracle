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
import { publicMetadata } from "@/lib/seo";
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
    title: `Аркан ${arcanum.number} ${arcanum.name} в матрице судьбы — значение`,
    description: shortDescription(arcanum.essence[0] ?? arcanum.name),
    path: arcanumPath(arcanum),
    image: { url: arcanumImage(arcanum), alt: `Аркан ${arcanum.number} «${arcanum.name}»` },
  });
}

const neighbour = (number: number) => arcanumByNumber(((number - 1 + ARCANA.length) % ARCANA.length) + 1);

type SectionKey = "essence" | "personality" | "center" | "task" | "love" | "money" | "resource" | "distortion" | "action" | "question";
// Порядок разделов страницы: те же десять, что и прежде
const SECTIONS: readonly SectionKey[] = ["essence", "personality", "center", "task", "love", "money", "resource", "distortion", "action", "question"];
const sectionId = (key: SectionKey) => `razdel-${key}`;

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
  const toc = SECTIONS.map((key) => ({ id: sectionId(key), title: SECTION_TITLES[key] }));

  return (
    <main className="detail-page arcanum-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
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
              <ArcanumSection key={key} id={sectionId(key)} title={SECTION_TITLES[key]} className="detail-section" defaultOpen={key === "essence"}>
                <SectionBody arcanum={arcanum} sectionKey={key} />
              </ArcanumSection>
            ))}
          </div>
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
