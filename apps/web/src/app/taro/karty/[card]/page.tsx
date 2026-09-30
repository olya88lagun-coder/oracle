import { TAROT_DECK, tarotCardText } from "@oracle/content/tarot";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaroCardView } from "@/components/taro/TaroCardView";
import { shortDescription } from "@/lib/arcana-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { taroCardFromParam, taroCardImage, taroCardPath } from "@/lib/taro-paths";

type Params = { params: Promise<{ card: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return TAROT_DECK.map((card) => ({ card: card.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const ref = taroCardFromParam((await params).card);
  const card = ref && tarotCardText(ref.slug);
  if (!card) return {};
  return publicMetadata({
    title: `Карта Таро ${card.name} — значение, в отношениях и в деле`,
    description: shortDescription(card.essence[0] ?? card.name),
    path: taroCardPath(card),
    image: { url: taroCardImage(card), alt: `Карта Таро ${card.name}`, width: 554, height: 960 },
  });
}

export default async function TaroCardPage({ params }: Params) {
  const ref = taroCardFromParam((await params).card);
  const card = ref && tarotCardText(ref.slug);
  if (!card) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Карта Таро ${card.name}: значение`,
    description: shortDescription(card.essence[0] ?? card.name),
    inLanguage: "ru",
    keywords: card.keywords.join(", "),
    mainEntityOfPage: `${SITE_URL}${taroCardPath(card)}`,
    image: `${SITE_URL}${taroCardImage(card)}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <TaroCardView card={card} />
    </>
  );
}
