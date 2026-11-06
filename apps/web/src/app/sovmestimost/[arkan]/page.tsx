import { ARCANA, arcanumByNumber, type Arcanum } from "@oracle/content";
import { compatUnionByNumber, type CompatUnion } from "@oracle/content/compat";
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
import { BLOG_PATH } from "@/lib/blog";
import { COMPAT_PATH, compatArcanumPath } from "@/lib/compat";
import { breadcrumbJsonLd, jsonLdScript, publicMetadata } from "@/lib/seo";
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
    title: `${arcanum.number} аркан в совместимости: ${arcanum.name} в паре — значение`,
    description: shortDescription(compatUnionByNumber(arcanum.number).essence),
    path: compatArcanumPath(arcanum),
    image: { url: arcanumImage(arcanum), alt: `Аркан ${arcanum.number} «${arcanum.name}»` },
  });
}

const neighbour = (number: number) => arcanumByNumber(((number - 1 + ARCANA.length) % ARCANA.length) + 1);

type SectionKey = "gives" | "attention" | "more" | "question";
const SECTIONS: readonly SectionKey[] = ["gives", "attention", "more", "question"];
const TITLES: Readonly<Record<SectionKey, string>> = {
  gives: "Что даёт союзу",
  attention: "Где стоит присмотреться",
  more: "В повседневной жизни пары",
  question: "Вопрос для двоих",
};
const sectionId = (key: SectionKey) => `razdel-${key}`;

function SectionBody({ union, sectionKey }: { union: CompatUnion; sectionKey: SectionKey }) {
  if (sectionKey === "more") return <>{union.more.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</>;
  if (sectionKey === "question") return <p className="detail-question">{union.question}</p>;
  return <p>{union[sectionKey]}</p>;
}

const pageJsonLd = (arcanum: Arcanum, union: CompatUnion) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: `Аркан ${arcanum.number} «${arcanum.name}» в совместимости`,
  description: shortDescription(union.essence),
  inLanguage: "ru",
  mainEntityOfPage: `${SITE_URL}${compatArcanumPath(arcanum)}`,
  image: `${SITE_URL}${arcanumImage(arcanum)}`,
});

export default async function CompatArcanumPage({ params }: Params) {
  const arcanum = arcanumFromParam((await params).arkan);
  if (!arcanum) notFound();
  const union = compatUnionByNumber(arcanum.number);
  const previous = neighbour(arcanum.number - 1);
  const next = neighbour(arcanum.number + 1);
  const toc = SECTIONS.map((key) => ({ id: sectionId(key), title: TITLES[key] }));
  const crumbs = breadcrumbJsonLd([
    { name: "Совместимость", path: COMPAT_PATH },
    { name: `Аркан ${arcanum.number} в совместимости`, path: compatArcanumPath(arcanum) },
  ]);

  return (
    <main className="detail-page arcanum-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(pageJsonLd(arcanum, union)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }} />
      <nav aria-label="Навигация" className="detail-crumbs">
        <Link className="touch-link" href={COMPAT_PATH}>
          Совместимость
        </Link>{" "}
        › Аркан {arcanum.number}
      </nav>

      <div className="detail-grid">
        <aside className="detail-side">
          <figure className="detail-media">
            <ImageZoom src={arcanumImage(arcanum, "card")} fullSrc={arcanumImage(arcanum)} alt={`Аркан ${arcanum.number} «${arcanum.name}»`} width={440} height={440} priority />
            <figcaption>
              Аркан пары {arcanum.number} · {arcanum.name}
            </figcaption>
          </figure>
          <DetailToc items={toc} />
        </aside>

        <div className="detail-main">
          <header className="detail-head stack">
            <h1 className={`display detail-title${arcanum.name.length > 14 ? " detail-title--long" : ""}`}>
              {arcanum.name} <span>в совместимости</span>
            </h1>
            <p className="lead">{union.essence}</p>
            <div className="detail-actions">
              <Link className="button button--lavender" href={COMPAT_PATH}>
                Рассчитать аркан своей пары
              </Link>
              <a className="matrix-link" href="#arcana-index">
                Все арканы пары
              </a>
            </div>
          </header>

          <ExpandAll selector="details.arcanum-section" />
          <div className="detail-sections">
            {SECTIONS.map((key) => (
              <ArcanumSection key={key} id={sectionId(key)} title={TITLES[key]} className="detail-section" defaultOpen={key === "gives"}>
                <SectionBody union={union} sectionKey={key} />
              </ArcanumSection>
            ))}
          </div>

          <section className="stack" aria-labelledby="compat-pair-how">
            <h2 id="compat-pair-how">Как получается аркан пары</h2>
            <p>
              Для каждого из двоих по дате рождения считается матрица судьбы, и из неё берётся центр — число от 1 до 22. Центры складываются, а если
              сумма больше 22, её цифры складываются ещё раз. Например, центры 8 и 15 дают 23, а 2 + 3 = 5: аркан такой пары — пятый. Если у вашей
              пары получился аркан {arcanum.number}, общая тема союза — та, что описана на этой странице.
            </p>
            <p>
              Подробно расчёт разобран в статье{" "}
              <Link href={`${BLOG_PATH}/kak-schitaetsya-matritsa-sovmestimosti`}>о том, как считается матрица совместимости</Link>, а как читать
              остальные блоки результата — в статье <Link href={`${BLOG_PATH}/matritsa-sovmestimosti-rasshifrovka`}>о расшифровке совместимости</Link>.
              Значение этого аркана для одного человека — личность, центр, отношения, деньги — на странице{" "}
              <Link href={arcanumPath(arcanum)}>
                аркана {arcanum.number} «{arcanum.name}» в матрице судьбы
              </Link>
              .
            </p>
            <p className="muted">Аркан пары — тема для разговора, а не оценка отношений и не предсказание того, как сложится союз.</p>
          </section>
        </div>
      </div>

      <DetailPager
        label="Соседние арканы пары"
        previous={{ href: compatArcanumPath(previous), label: `${previous.number} · ${previous.name}`, image: arcanumImage(previous, "thumb"), imageSize: 64 }}
        next={{ href: compatArcanumPath(next), label: `${next.number} · ${next.name}`, image: arcanumImage(next, "thumb"), imageSize: 64 }}
      />

      <div id="arcana-index" className="detail-index">
        <ArcanaIndex
          current={arcanum.number}
          title="Все 22 аркана совместимости"
          hub={{ href: COMPAT_PATH, label: "Рассчитать совместимость по дате рождения" }}
          pathOf={compatArcanumPath}
        />
      </div>
      <ArcanumSectionsExpander />
    </main>
  );
}
