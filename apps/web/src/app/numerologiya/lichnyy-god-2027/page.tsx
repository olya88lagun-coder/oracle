import { acceptedNumerologyPages, numerologySummary, numerologyText } from "@oracle/content/numerology";
import type { Metadata } from "next";
import Link from "next/link";
import type { FateSummary } from "@/components/numerology/FateResult";
import { PersonalYearCalculator } from "@/components/numerology/PersonalYearCalculator";
import { NUMEROLOGY_PATH, PERSONAL_YEAR_FAQ, PERSONAL_YEAR_PATH, personalYearPath } from "@/lib/numerology";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { YEAR_PATH } from "@/lib/year-arcana";
import "../../arkan-2027/year.css";
import "../numerology.css";

export const metadata: Metadata = publicMetadata({
  title: "Личный год 2027 по дате рождения",
  description: "Рассчитайте личный год 2027 по дню и месяцу рождения: открытая формула, тема года в девятилетнем цикле и три совета. Бесплатно, без регистрации.",
  path: PERSONAL_YEAR_PATH,
});

const YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function acceptedSummaries(): Record<number, FateSummary> {
  const summaries: Record<number, FateSummary> = {};
  for (const page of acceptedNumerologyPages("year")) {
    const text = numerologyText("year", page.key);
    if (text) summaries[Number(page.key)] = { text: numerologySummary(text), href: personalYearPath(Number(page.key)) };
  }
  return summaries;
}

export default function PersonalYearPage() {
  const summaries = acceptedSummaries();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebApplication", name: "Калькулятор личного года 2027", url: `${SITE_URL}${PERSONAL_YEAR_PATH}`, applicationCategory: "LifestyleApplication", operatingSystem: "Web", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } },
      { "@type": "FAQPage", mainEntity: PERSONAL_YEAR_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Нумерология", item: `${SITE_URL}${NUMEROLOGY_PATH}` },
        { "@type": "ListItem", position: 2, name: "Личный год 2027", item: `${SITE_URL}${PERSONAL_YEAR_PATH}` },
      ] },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
    <main className="year-page">
      <nav aria-label="Хлебные крошки" className="year-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={NUMEROLOGY_PATH}>Нумерология</Link><span aria-hidden="true">/</span><span>Личный год 2027</span></nav>
      <PersonalYearCalculator summaries={summaries} />
      <section className="year-guide" aria-labelledby="personal-year-guide-title">
        <div className="stack"><p className="eyebrow">Девятилетний цикл</p><h2 id="personal-year-guide-title">Не прогноз.<br />Этап пути.</h2><p>В нумерологии годы идут циклами по девять: начало, терпение, самовыражение, фундамент, перемены, забота, осмысление, результаты, завершение. Личный год подсказывает, какой этап начинается для вас в 2027 году.</p><p>Это символическая тема, а не предсказание событий.</p></div>
        <div className="year-method stack"><h3>Открытая формула</h3><p>Цифры дня и месяца рождения + 2 + 0 + 2 + 7, сумма сворачивается до 1–9.</p><p>Например, 14 марта: 1 + 4 + 0 + 3 + 2 + 0 + 2 + 7 = 19; 1 + 9 = 10; 1 + 0 = <strong>1</strong>.</p><p>По дате рождения можно узнать и <Link href={YEAR_PATH}>аркан 2027 года</Link> — другую практику, которая описывает год через образы арканов.</p></div>
      </section>
      <section className="year-catalog numerology-catalog" aria-labelledby="personal-year-catalog-title">
        <p className="eyebrow">Все личные годы</p>
        <h2 id="personal-year-catalog-title">Значения личного года 2027</h2>
        <ul>{YEARS.map((n) => <li key={n}>{summaries[n] ? <Link href={personalYearPath(n)} aria-label={`Личный год ${n}`}>{n}</Link> : <span title="Описание появится позже">{n}</span>}</li>)}</ul>
      </section>
      <section className="year-faq" aria-labelledby="personal-year-faq-title"><p className="eyebrow">Вопросы</p><h2 id="personal-year-faq-title">О личном годе</h2>{PERSONAL_YEAR_FAQ.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
      <p className="muted year-footnote">Практика для самопознания. Решения о здоровье, деньгах и отношениях опирайте на факты и свою ситуацию.</p>
    </main>
  </>;
}
