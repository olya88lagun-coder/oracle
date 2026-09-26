import { ARCANA, arcanumByNumber, SECTION_TITLES } from "@oracle/content";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArcanaIndex } from "@/components/ArcanaIndex";
import { ArcanumSection } from "@/components/ArcanumSection";
import { ArcanumSectionsExpander } from "@/components/ArcanumSectionsExpander";
import { CalculatorLink } from "@/components/CalculatorLink";
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

export default async function ArcanumPage({ params }: Params) {
  const arcanum = arcanumFromParam((await params).arkan);
  if (!arcanum) notFound();
  const previous = neighbour(arcanum.number - 1);
  const next = neighbour(arcanum.number + 1);
  const jsonLd = JSON.stringify(arcanumJsonLd(arcanum, SITE_URL)).replace(/</g, "\\u003c");

  return (
    <main className="page page--wide stack arcanum-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Навигация" className="muted">
        <Link className="touch-link" href={MATRIX_PATH}>
          Матрица судьбы
        </Link> › Аркан {arcanum.number}
      </nav>

      <header className="arcanum-hero">
        <figure className="arcanum-hero__art">
          <Image src={arcanumImage(arcanum)} alt={`Аркан ${arcanum.number} «${arcanum.name}»`} fill priority unoptimized sizes="(min-width: 900px) 480px, 100vw" />
          <span className="arcanum-hero__number" aria-hidden="true">
            {arcanum.number}
          </span>
        </figure>
        <div className="stack arcanum-hero__text">
          <p className="eyebrow eyebrow--line">Аркан {arcanum.number}</p>
          <h1 className="display">{arcanum.name}</h1>
          <ul className="row arcanum-hero__keywords" aria-label="Ключевые слова">
            {arcanum.keywords.map((keyword) => (
              <li key={keyword} className="tag">
                {keyword}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="arcanum-grid">
        <ArcanumSection title={SECTION_TITLES.essence} className="arcanum-section--plain" defaultOpen>
          {arcanum.essence.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </ArcanumSection>
        <aside className="card card--accent stack">
          <h2>Рассчитать свою матрицу</h2>
          <p className="muted">Узнайте, где этот аркан стоит в вашей дате рождения.</p>
          <p>
            <CalculatorLink>Рассчитать свою матрицу</CalculatorLink>
          </p>
        </aside>
      </div>

      <section className="arcanum-positions" aria-label="Аркан в позициях матрицы">
        {(["personality", "center", "task"] as const).map((key) => (
          <ArcanumSection key={key} title={SECTION_TITLES[key]} className="card">
            {arcanum[key].map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </ArcanumSection>
        ))}
      </section>

      <section className="arcanum-poles" aria-label="Ресурс и перекос">
        {(["resource", "distortion"] as const).map((key) => (
          <ArcanumSection key={key} title={SECTION_TITLES[key]} className="card">
            <ul>
              {arcanum[key].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </ArcanumSection>
        ))}
      </section>

      <section className="arcanum-poles" aria-label="Практика">
        <ArcanumSection title={SECTION_TITLES.action} className="card">
          <p>{arcanum.action}</p>
        </ArcanumSection>
        <ArcanumSection title={SECTION_TITLES.question} className="card">
          <p className="arcanum-question">{arcanum.question}</p>
        </ArcanumSection>
      </section>

      <p>
        <CalculatorLink>Рассчитать свою матрицу</CalculatorLink>
      </p>

      <nav className="row arcanum-neighbours" aria-label="Соседние арканы">
        <Link className="button button--ghost" href={arcanumPath(previous)}>
          ← {previous.number} · {previous.name}
        </Link>
        <Link className="button button--ghost" href={arcanumPath(next)}>
          {next.number} · {next.name} →
        </Link>
      </nav>

      <ArcanaIndex current={arcanum.number} />
      <ArcanumSectionsExpander />
    </main>
  );
}
