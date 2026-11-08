import { acceptedNumerologyPages, numerologyText } from "@oracle/content/numerology";
import { clockBySlug } from "@oracle/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NumerologyPageView } from "@/components/numerology/NumerologyPageView";
import { CLOCK_PATH, clockPath, NUMEROLOGY_PATH, relatedClocks } from "@/lib/numerology";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../../../arkan-2027/year.css";
import "../../numerology.css";

type Params = { params: Promise<{ time: string }> };

// Только «чч-мм» принятых партий; «1111», «11:11» и несуществующее время — настоящий 404
export const dynamicParams = false;

export function generateStaticParams() {
  return acceptedNumerologyPages("clock").map((page) => ({ time: page.key }));
}

const acceptedText = (time: string) => (acceptedNumerologyPages("clock").some((page) => page.key === time) ? numerologyText("clock", time) : undefined);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { time } = await params;
  const text = acceptedText(time);
  if (!text) return {};
  return publicMetadata({ title: text.title, description: text.description, path: clockPath(time) });
}

export default async function ClockTimePage({ params }: Params) {
  const { time } = await params;
  const text = acceptedText(time);
  const clock = clockBySlug(time);
  if (!text || !clock) notFound();
  const url = `${SITE_URL}${clockPath(time)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: text.title, description: text.description, inLanguage: "ru", mainEntityOfPage: url },
      { "@type": "FAQPage", mainEntity: text.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Нумерология", item: `${SITE_URL}${NUMEROLOGY_PATH}` },
        { "@type": "ListItem", position: 2, name: "Время на часах", item: `${SITE_URL}${CLOCK_PATH}` },
        { "@type": "ListItem", position: 3, name: clock.label, item: url },
      ] },
    ],
  };
  const siblings = relatedClocks(time).map((related) => ({ name: related.label, href: clockPath(related.slug) }));
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
    <NumerologyPageView text={text} crumbs={[{ name: "Нумерология", href: NUMEROLOGY_PATH }, { name: "Время на часах", href: CLOCK_PATH }]} siblings={siblings} footer={{ name: "Всё одинаковое и зеркальное время", href: CLOCK_PATH }} />
  </>;
}
