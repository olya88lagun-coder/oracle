import { acceptedNumerologyPages, numerologySummary, numerologyText } from "@oracle/content/numerology";
import { FATE_NUMBERS, MASTER_NUMBERS } from "@oracle/core";
import type { Metadata } from "next";
import Link from "next/link";
import { SquarePairLink } from "@/components/numerology/SquarePairLink";
import { FateCalculator } from "@/components/numerology/FateCalculator";
import type { FateSummary } from "@/components/numerology/FateResult";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { PYTHAGORAS_PATH } from "@/lib/pythagoras";
import { CLOCK_PATH, FATE_FAQ, fatePath, NUMEROLOGY_PATH, PERSONAL_YEAR_PATH } from "@/lib/numerology";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../arkan-2027/year.css";
import "./numerology.css";

export const metadata: Metadata = publicMetadata({
  title: "Число судьбы по дате рождения — рассчитать",
  description: "Рассчитайте число судьбы по дате рождения: открытая формула, мастер-числа 11, 22 и 33 и описание каждого числа. Бесплатно, без регистрации.",
  path: NUMEROLOGY_PATH,
});

function acceptedSummaries(): Record<number, FateSummary> {
  const summaries: Record<number, FateSummary> = {};
  for (const page of acceptedNumerologyPages("fate")) {
    const text = numerologyText("fate", page.key);
    if (text) summaries[Number(page.key)] = { text: numerologySummary(text), href: fatePath(Number(page.key)) };
  }
  return summaries;
}

export default function NumerologyPage() {
  const summaries = acceptedSummaries();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebApplication", name: "Калькулятор числа судьбы", url: `${SITE_URL}${NUMEROLOGY_PATH}`, applicationCategory: "LifestyleApplication", operatingSystem: "Web", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } },
      { "@type": "FAQPage", mainEntity: FATE_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Твой оракул", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Нумерология", item: `${SITE_URL}${NUMEROLOGY_PATH}` },
      ] },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
    <main className="year-page numerology-page numerology-landing">
      <nav aria-label="Хлебные крошки" className="year-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><span>Нумерология</span></nav>
      <FateCalculator summaries={summaries} />
      <section className="year-guide" aria-labelledby="fate-guide-title">
        <div className="stack"><p className="eyebrow">Как читать результат</p><h2 id="fate-guide-title">Не приговор.<br />Тема для размышления.</h2><p>Число судьбы — символ, к которому можно примерять свой опыт. Прочитайте описание, отметьте, что откликается, и вернитесь к вопросу через время: ответ может измениться вместе с вами.</p><p>Это не прогноз событий. Число не определяет здоровье, доход или отношения.</p></div>
        <div className="year-method stack"><h3>Открытая формула</h3><p>Складываем все цифры полной даты рождения и сворачиваем сумму, пока не получится 1–9. Если на любом шаге вышло 11, 22 или 33, останавливаемся.</p><p>Например, 14.03.1992: 1 + 4 + 0 + 3 + 1 + 9 + 9 + 2 = 29; 2 + 9 = <strong>11</strong>.</p><p>По той же дате можно рассчитать <Link href={MATRIX_PATH}>матрицу судьбы</Link> — это другая практика, они дополняют друг друга.</p><Link className="touch-link" href={PERSONAL_YEAR_PATH}>Личный год 2027</Link><Link className="touch-link" href={CLOCK_PATH}>Одинаковое и зеркальное время на часах</Link><Link className="touch-link" href={PYTHAGORAS_PATH}>Квадрат Пифагора по дате рождения</Link><SquarePairLink /><Link className="touch-link" href="/metodika">О текстах и методике сайта</Link></div>
      </section>
      <section className="year-catalog numerology-catalog" aria-labelledby="fate-catalog-title">
        <p className="eyebrow">Все числа</p>
        <h2 id="fate-catalog-title">Значения чисел судьбы</h2>
        <ul>{FATE_NUMBERS.map((n) => <li key={n} className={MASTER_NUMBERS.some((number) => number === n) ? "numerology-master" : undefined}>{summaries[n] ? <Link href={fatePath(n)} aria-label={`Число судьбы ${n}`}>{n}</Link> : <span title="Описание появится позже">{n}</span>}</li>)}</ul>
      </section>
      <section className="year-faq" aria-labelledby="fate-faq-title"><p className="eyebrow">Вопросы</p><h2 id="fate-faq-title">О числе судьбы</h2>{FATE_FAQ.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
      <p className="muted year-footnote">Практика для самопознания. Решения о здоровье, деньгах и отношениях опирайте на факты и свою ситуацию.</p>
    </main>
  </>;
}
