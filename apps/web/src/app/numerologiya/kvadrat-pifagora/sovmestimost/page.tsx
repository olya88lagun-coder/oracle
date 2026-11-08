import { acceptedNumerologyPages, numerologyText, pairCellSection, pairLineSection, type NumerologyText } from "@oracle/content/numerology";
import { SQUARE_LINES } from "@oracle/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PythagorasCompatCalculator } from "@/components/numerology/PythagorasCompatCalculator";
import type { PairTexts } from "@/components/numerology/PythagorasCompatResult";
import { NUMEROLOGY_PATH } from "@/lib/numerology";
import { PYTHAGORAS_COMPAT_PATH, PYTHAGORAS_PATH } from "@/lib/pythagoras";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../../../arkan-2027/year.css";
import "../../numerology.css";

const INTRO = ["Как считается совместимость по квадрату", "Как читать сравнение"] as const;

// Только принятая партия 8; до этого страница — настоящий 404
const acceptedText = (): NumerologyText | undefined => (acceptedNumerologyPages("pair").length ? numerologyText("pair", "sovmestimost") : undefined);

// В браузер уходят только первые абзацы разделов пары, без вводных и FAQ
function pairTexts(text: NumerologyText): PairTexts {
  const first = (title: string) => text.sections.find((section) => section.title === title)?.paragraphs[0];
  const cells: Record<number, PairTexts["cells"][number]> = {};
  for (const cell of [1, 2, 3, 4, 5, 6, 7, 8, 9]) cells[cell] = { empty: first(pairCellSection(cell, "empty")), close: first(pairCellSection(cell, "close")), apart: first(pairCellSection(cell, "apart")) };
  const lines: Record<string, { same?: string; differ?: string }> = {};
  for (const line of SQUARE_LINES) lines[line.id] = { same: first(pairLineSection(line.id, "same")), differ: first(pairLineSection(line.id, "differ")) };
  return { cells, lines };
}

export async function generateMetadata(): Promise<Metadata> {
  const text = acceptedText();
  if (!text) return {};
  return publicMetadata({ title: "Совместимость по квадрату Пифагора онлайн", description: text.description, path: PYTHAGORAS_COMPAT_PATH });
}

export default function PythagorasCompatPage() {
  const text = acceptedText();
  if (!text) notFound();
  const url = `${SITE_URL}${PYTHAGORAS_COMPAT_PATH}`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebApplication", name: "Совместимость по квадрату Пифагора", url, applicationCategory: "LifestyleApplication", operatingSystem: "Web", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } },
      { "@type": "FAQPage", mainEntity: text.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Нумерология", item: `${SITE_URL}${NUMEROLOGY_PATH}` },
        { "@type": "ListItem", position: 2, name: "Квадрат Пифагора", item: `${SITE_URL}${PYTHAGORAS_PATH}` },
        { "@type": "ListItem", position: 3, name: "Совместимость", item: url },
      ] },
    ],
  };
  const intro = INTRO.map((title) => text.sections.find((section) => section.title === title)).filter((section) => section !== undefined);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
    <main className="year-page numerology-page numerology-pair-page">
      <nav aria-label="Хлебные крошки" className="year-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={NUMEROLOGY_PATH}>Нумерология</Link><span aria-hidden="true">/</span><Link href={PYTHAGORAS_PATH}>Квадрат Пифагора</Link><span aria-hidden="true">/</span><span>Совместимость</span></nav>
      <PythagorasCompatCalculator texts={pairTexts(text)} />
      {intro.map((section, i) => <section key={section.title} className="year-guide numerology-pair-guide" aria-labelledby={`pair-guide-${i}`}>
        <div className="stack"><h2 id={`pair-guide-${i}`}>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section>)}
      <section className="year-faq" aria-labelledby="pair-faq-title"><p className="eyebrow">Вопросы</p><h2 id="pair-faq-title">Частые вопросы</h2>{text.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
      <p className="muted year-footnote">Практика для самопознания. Решения о здоровье, деньгах и отношениях опирайте на факты и свою ситуацию.</p>
    </main>
  </>;
}
