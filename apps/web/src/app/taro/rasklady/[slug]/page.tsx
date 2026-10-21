import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpreadPlay } from "@/components/taro/SpreadPlay";
import { spreadDeck } from "@/components/taro/spread-cards";
import { breadcrumbsJsonLd, faqPageJsonLd, TaroFaqSection } from "@/components/taro/TaroFaqSection";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { TARO_DAY_PATH, TARO_PATH, TARO_SPREADS_PATH } from "@/lib/taro-paths";
import { spreadFromParam, spreadPath, TARO_SPREADS } from "@/lib/taro-spreads";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return TARO_SPREADS.map((spread) => ({ slug: spread.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const spread = spreadFromParam((await params).slug);
  if (!spread) return {};
  return publicMetadata({ title: spread.title, description: spread.description, path: spreadPath(spread), image: SITE_PREVIEW_IMAGE });
}

export default async function TaroSpreadPage({ params }: Params) {
  const spread = spreadFromParam((await params).slug);
  if (!spread) notFound();
  const breadcrumbs = breadcrumbsJsonLd([
    { name: "Таро", path: TARO_PATH },
    { name: "Расклады", path: TARO_SPREADS_PATH },
    { name: spread.name, path: spreadPath(spread) },
  ]);
  const others = TARO_SPREADS.filter((item) => item.slug !== spread.slug);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faqPageJsonLd(spread.faq)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
      <main className="page page--wide stack taro-page taro-spread-page">
        <header className="taro-spreads-head">
          <p className="eyebrow eyebrow--line">Расклад Таро</p>
          <h1 className="display">{spread.name}</h1>
          <p className="lead">{spread.lead}</p>
        </header>
        <section aria-labelledby="spread-positions" className="taro-spread-info">
          <h2 id="spread-positions">Позиции расклада</h2>
          <ol className="taro-spread-positions">
            {spread.positions.map((position) => (
              <li key={position.title}>
                <strong>{position.title}.</strong> {position.hint}
              </li>
            ))}
          </ol>
        </section>
        <SpreadPlay positions={spread.positions} cards={spreadDeck(spread)} />
        <TaroFaqSection id="spread-faq" title={`Частые вопросы: ${spread.name.toLowerCase()}`} items={spread.faq} />
        <nav className="taro-spread-others" aria-labelledby="spread-others">
          <h2 id="spread-others">Другие расклады</h2>
          <ul>
            {others.map((item) => (
              <li key={item.slug}>
                <Link className="touch-link" href={spreadPath(item)}>
                  {item.name}
                </Link>
              </li>
            ))}
            <li>
              <Link className="touch-link" href={TARO_SPREADS_PATH}>
                Все расклады Таро
              </Link>
            </li>
            <li>
              <Link className="touch-link" href={TARO_DAY_PATH}>
                Карта дня
              </Link>
            </li>
          </ul>
        </nav>
      </main>
    </>
  );
}
