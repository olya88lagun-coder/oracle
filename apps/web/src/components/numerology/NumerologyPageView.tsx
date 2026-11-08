import type { NumerologyText } from "@oracle/content/numerology";
import Link from "next/link";

type Crumb = { name: string; href: string };

// Страница значения: число судьбы, личный год или время на часах. Разделы — по порядку из текста
export function NumerologyPageView({ text, crumbs, siblings, footer }: { text: NumerologyText; crumbs: readonly Crumb[]; siblings: readonly Crumb[]; footer: Crumb }) {
  return <main className="year-page numerology-page">
    <nav aria-label="Хлебные крошки" className="year-breadcrumb">
      <Link href="/">Главная</Link>
      {crumbs.map((crumb) => <span key={crumb.href} className="numerology-crumb"><span aria-hidden="true">/</span><Link href={crumb.href}>{crumb.name}</Link></span>)}
    </nav>
    <article className="numerology-article stack">
      <h1 className="display">{text.title}</h1>
      {text.sections.map((section) => <section key={section.title} className="stack">
        <h2>{section.title}</h2>
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {section.items.length > 0 && <ul className="year-advice">{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
      </section>)}
      {text.faq.length > 0 && <section className="year-faq stack">
        <h2>Частые вопросы</h2>
        {text.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
      </section>}
    </article>
    {siblings.length > 0 && <nav aria-label="Другие значения" className="numerology-siblings">
      <ul>{siblings.map((sibling) => <li key={sibling.href}><Link href={sibling.href}>{sibling.name}</Link></li>)}</ul>
    </nav>}
    <p><Link className="button" href={footer.href}>{footer.name}</Link></p>
    <p className="muted year-footnote">Практика для самопознания. Решения о здоровье, деньгах и отношениях опирайте на факты и свою ситуацию.</p>
  </main>;
}
