import { acceptedNumerologyPages, numerologyText } from "@oracle/content/numerology";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NumerologyPageView } from "@/components/numerology/NumerologyPageView";
import { NUMEROLOGY_PATH, PERSONAL_YEAR_PATH, personalYearPath } from "@/lib/numerology";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../../../arkan-2027/year.css";
import "../../numerology.css";

type Params = { params: Promise<{ n: string }> };

// Открыты только 1–9 принятой партии; мастер-чисел у личного года нет
export const dynamicParams = false;

export function generateStaticParams() {
  return acceptedNumerologyPages("year").map((page) => ({ n: page.key }));
}

const acceptedText = (n: string) => (acceptedNumerologyPages("year").some((page) => page.key === n) ? numerologyText("year", n) : undefined);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { n } = await params;
  const text = acceptedText(n);
  if (!text) return {};
  return publicMetadata({ title: text.title, description: text.description, path: personalYearPath(Number(n)) });
}

export default async function PersonalYearNumberPage({ params }: Params) {
  const { n } = await params;
  const text = acceptedText(n);
  if (!text) notFound();
  const url = `${SITE_URL}${personalYearPath(Number(n))}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: text.title, description: text.description, inLanguage: "ru", mainEntityOfPage: url },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Нумерология", item: `${SITE_URL}${NUMEROLOGY_PATH}` },
        { "@type": "ListItem", position: 2, name: "Личный год 2027", item: `${SITE_URL}${PERSONAL_YEAR_PATH}` },
        { "@type": "ListItem", position: 3, name: `Личный год ${n}`, item: url },
      ] },
    ],
  };
  const siblings = acceptedNumerologyPages("year").filter((page) => page.key !== n).map((page) => ({ name: page.key, href: personalYearPath(Number(page.key)) }));
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
    <NumerologyPageView text={text} emblem={n} crumbs={[{ name: "Нумерология", href: NUMEROLOGY_PATH }, { name: "Личный год 2027", href: PERSONAL_YEAR_PATH }]} siblings={siblings} footer={{ name: "Рассчитать свой личный год", href: PERSONAL_YEAR_PATH }} />
  </>;
}
