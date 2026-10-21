import { SITE_URL } from "@/lib/site";
import type { FaqItem } from "@/lib/taro-spreads";

export function faqPageJsonLd(items: readonly FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ru",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

export function breadcrumbsJsonLd(crumbs: readonly { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: `${SITE_URL}${crumb.path}` })),
  };
}

// Вопросы раскрываются; первый открыт сразу. Тексты те же, что в разметке FAQPage
export function TaroFaqSection({ id, title, items }: { id: string; title: string; items: readonly FaqItem[] }) {
  return (
    <section className="matrix-faq taro-spreads-faq" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <div className="matrix-faq__list">
        {items.map((item, index) => (
          <details key={item.question} open={index === 0}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
