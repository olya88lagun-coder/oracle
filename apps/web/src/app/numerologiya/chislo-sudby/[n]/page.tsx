import { acceptedNumerologyPages, numerologyText } from "@oracle/content/numerology";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NumerologyPageView } from "@/components/numerology/NumerologyPageView";
import { fatePath, NUMEROLOGY_PATH } from "@/lib/numerology";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../../../arkan-2027/year.css";
import "../../numerology.css";

type Params = { params: Promise<{ n: string }> };

// Открыты только числа принятых партий; «07», «10» и прочее — настоящий 404
export const dynamicParams = false;

export function generateStaticParams() {
  return acceptedNumerologyPages("fate").map((page) => ({ n: page.key }));
}

const acceptedText = (n: string) => (acceptedNumerologyPages("fate").some((page) => page.key === n) ? numerologyText("fate", n) : undefined);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { n } = await params;
  const text = acceptedText(n);
  if (!text) return {};
  return publicMetadata({ title: text.title, description: text.description, path: fatePath(Number(n)) });
}

export default async function FateNumberPage({ params }: Params) {
  const { n } = await params;
  const text = acceptedText(n);
  if (!text) notFound();
  const url = `${SITE_URL}${fatePath(Number(n))}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: text.title, description: text.description, inLanguage: "ru", mainEntityOfPage: url },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Нумерология", item: `${SITE_URL}${NUMEROLOGY_PATH}` },
        { "@type": "ListItem", position: 2, name: `Число судьбы ${n}`, item: url },
      ] },
    ],
  };
  const siblings = acceptedNumerologyPages("fate").filter((page) => page.key !== n).map((page) => ({ name: page.key, href: fatePath(Number(page.key)) }));
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
    <NumerologyPageView text={text} emblem={n} crumbs={[{ name: "Нумерология", href: NUMEROLOGY_PATH }]} siblings={siblings} footer={{ name: "Рассчитать своё число судьбы", href: NUMEROLOGY_PATH }} />
  </>;
}
