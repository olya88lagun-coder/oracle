import Link from "next/link";
import { MOON_PATH } from "@/lib/moon-paths";
import { SITE_URL } from "@/lib/site";

// Общие части лунных страниц: заголовок с хлебными крошками, блок вопросов и разметка schema.org
export type FaqItem = { question: string; answer: string };

export function MoonHead({ title, intro }: { title: string; intro: string | null }) {
  return (
    <>
      <nav aria-label="Хлебные крошки" className="moon-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={MOON_PATH}>Луна сегодня</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
      <header className="moon-month__head">
        <h1>{title}</h1>
        <p className="moon-hero__place">По Москве</p>
        {intro && <p className="moon-month__intro">{intro}</p>}
      </header>
    </>
  );
}

export function MoonFaq({ id, title, items }: { id: string; title: string; items: readonly FaqItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="moon-faq" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {items.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
    </section>
  );
}

export function moonJsonLd(name: string, path: string, faq: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name, url: `${SITE_URL}${path}`, inLanguage: "ru" },
      ...(faq.length ? [{ "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }] : []),
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Твой оракул", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Луна сегодня", item: `${SITE_URL}${MOON_PATH}` },
        { "@type": "ListItem", position: 3, name, item: `${SITE_URL}${path}` },
      ] },
    ],
  };
}
