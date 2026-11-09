import { acceptedNumerologyPages, numerologyText } from "@oracle/content/numerology";
import { SQUARE_LINES } from "@oracle/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NumerologyPageView } from "@/components/numerology/NumerologyPageView";
import { SquarePairLink } from "@/components/numerology/SquarePairLink";
import { NUMEROLOGY_PATH } from "@/lib/numerology";
import { PYTHAGORAS_PATH, SQUARE_LINE_NAMES, squareVariant } from "@/lib/pythagoras";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../../../arkan-2027/year.css";
import "../../numerology.css";

type Params = { params: Promise<{ cell: string }> };

// Ячейки 1–9 и страница линий принятых партий; «0», «10», «01» и прочее — настоящий 404
export const dynamicParams = false;

export function generateStaticParams() {
  return acceptedNumerologyPages("square").map((page) => ({ cell: page.key }));
}

const acceptedText = (cell: string) => (acceptedNumerologyPages("square").some((page) => page.key === cell) ? numerologyText("square", cell) : undefined);
const pathOf = (key: string) => `${PYTHAGORAS_PATH}/${key}`;
const labelOf = (key: string) => (key === "linii" ? "Линии" : key);

// Заголовок раздела → якорь: варианты ячейки (#pusto, #4 … #44444) или линии (#celeustremlennost …)
function anchorsOf(key: string): Record<string, string> {
  if (key === "linii") return Object.fromEntries(SQUARE_LINES.map((line) => [SQUARE_LINE_NAMES[line.id], line.id]));
  return Object.fromEntries([0, 1, 2, 3, 4, 5].map((count) => squareVariant(Number(key), count)).map((variant) => [variant.title, variant.anchor]));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { cell } = await params;
  const text = acceptedText(cell);
  if (!text) return {};
  return publicMetadata({ title: text.title, description: text.description, path: pathOf(cell) });
}

export default async function SquareCellPage({ params }: Params) {
  const { cell } = await params;
  const text = acceptedText(cell);
  if (!text) notFound();
  const url = `${SITE_URL}${pathOf(cell)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: text.title, description: text.description, inLanguage: "ru", mainEntityOfPage: url },
      { "@type": "FAQPage", mainEntity: text.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Нумерология", item: `${SITE_URL}${NUMEROLOGY_PATH}` },
        { "@type": "ListItem", position: 2, name: "Квадрат Пифагора", item: `${SITE_URL}${PYTHAGORAS_PATH}` },
        { "@type": "ListItem", position: 3, name: cell === "linii" ? "Линии" : `Ячейка ${cell}`, item: url },
      ] },
    ],
  };
  const siblings = acceptedNumerologyPages("square").filter((page) => page.key !== cell).map((page) => ({ name: labelOf(page.key), href: pathOf(page.key) }));
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
    <NumerologyPageView text={text} emblem={cell === "linii" ? "3×3" : cell} anchors={anchorsOf(cell)} crumbs={[{ name: "Нумерология", href: NUMEROLOGY_PATH }, { name: "Квадрат Пифагора", href: PYTHAGORAS_PATH }]} siblings={siblings} footer={{ name: "Построить свой квадрат", href: PYTHAGORAS_PATH }}><SquarePairLink /></NumerologyPageView>
  </>;
}
