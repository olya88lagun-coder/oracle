import { acceptedNumerologyPages } from "@oracle/content/numerology";
import { CLOCK_TIMES, type ClockTime } from "@oracle/core";
import type { Metadata } from "next";
import Link from "next/link";
import { CLOCK_FAQ, CLOCK_PATH, clockPath, NUMEROLOGY_PATH } from "@/lib/numerology";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../../arkan-2027/year.css";
import "../numerology.css";

export const metadata: Metadata = publicMetadata({
  title: "Одинаковое и зеркальное время на часах",
  description: "Что значит одинаковое и зеркальное время на часах: 11:11, 12:21, 22:22 и ещё 34 сочетания. Значение каждого в нумерологии — символическое прочтение без прогнозов.",
  path: CLOCK_PATH,
});

const GROUPS = [
  { id: "clock-repeat", title: "Одинаковое время", lead: "Часы равны минутам: 01:01, 15:15, 23:23.", kinds: ["repeat", "both"] },
  { id: "clock-mirror", title: "Зеркальное время", lead: "Минуты — это часы, прочитанные справа налево: 12:21, 05:50, 23:32.", kinds: ["mirror", "both"] },
] as const;

export default function ClockHubPage() {
  const accepted = new Set(acceptedNumerologyPages("clock").map((page) => page.key));
  const tile = (time: ClockTime) => <li key={time.slug}>{accepted.has(time.slug) ? <Link href={clockPath(time.slug)}>{time.label}</Link> : <span title="Описание появится позже">{time.label}</span>}</li>;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "FAQPage", mainEntity: CLOCK_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Нумерология", item: `${SITE_URL}${NUMEROLOGY_PATH}` },
        { "@type": "ListItem", position: 2, name: "Время на часах", item: `${SITE_URL}${CLOCK_PATH}` },
      ] },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
    <main className="year-page numerology-page">
      <nav aria-label="Хлебные крошки" className="year-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={NUMEROLOGY_PATH}>Нумерология</Link><span aria-hidden="true">/</span><span>Время на часах</span></nav>
      <section className="numerology-article stack" aria-labelledby="clock-title">
        <p className="eyebrow">Нумерология · время на часах</p>
        <h1 className="display" id="clock-title">Одинаковое и зеркальное время на часах</h1>
        <p className="lead">Заметили на часах 11:11 или 12:21? Выберите время — на странице его значение в нумерологии: из каких чисел оно состоит, какую тему можно в нём прочитать и вопрос для себя. Это символы для размышления, а не знаки и не прогнозы.</p>
      </section>
      {GROUPS.map((group) => <section key={group.id} id={group.id} className="year-catalog numerology-catalog" aria-labelledby={`${group.id}-title`}>
        <h2 id={`${group.id}-title`}>{group.title}</h2>
        <p className="muted">{group.lead}</p>
        <ul>{CLOCK_TIMES.filter((time) => (group.kinds as readonly string[]).includes(time.kind)).map(tile)}</ul>
      </section>)}
      <section className="year-faq" aria-labelledby="clock-faq-title"><p className="eyebrow">Вопросы</p><h2 id="clock-faq-title">О времени на часах</h2>{CLOCK_FAQ.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
      <p><Link className="button" href={NUMEROLOGY_PATH}>Рассчитать число судьбы</Link></p>
      <p className="muted year-footnote">Практика для самопознания. Решения о здоровье, деньгах и отношениях опирайте на факты и свою ситуацию.</p>
    </main>
  </>;
}
