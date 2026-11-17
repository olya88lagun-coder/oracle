import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ThreadCalculator } from "@/components/numerology/ThreadCalculator";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { THREAD_FAQ, THREAD_PATH } from "@/lib/life-thread";
import { NUMEROLOGY_PATH, PERSONAL_YEAR_PATH } from "@/lib/numerology";
import { acceptedThreadPaths, acceptedThreadTexts } from "@/lib/numerology-pages";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../../arkan-2027/year.css";
import "../numerology.css";

export const metadata: Metadata = publicMetadata({
  title: "График судьбы по дате рождения",
  description: "Постройте график судьбы по дате рождения: нить личных годов на всю жизнь, точка «вы здесь», четыре периода и открытая формула. Бесплатно, без регистрации.",
  path: THREAD_PATH,
});

// Страница закрыта (настоящий 404), пока владелица не приняла партию текстов 9
export default function ThreadPage() {
  if (!acceptedThreadPaths().length) notFound();
  const texts = acceptedThreadTexts();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebApplication", name: "График судьбы по дате рождения", url: `${SITE_URL}${THREAD_PATH}`, applicationCategory: "LifestyleApplication", operatingSystem: "Web", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } },
      { "@type": "FAQPage", mainEntity: THREAD_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Твой оракул", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Нумерология", item: `${SITE_URL}${NUMEROLOGY_PATH}` },
        { "@type": "ListItem", position: 3, name: "График судьбы", item: `${SITE_URL}${THREAD_PATH}` },
      ] },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
    <main className="year-page numerology-page numerology-landing thread-page">
      <nav aria-label="Хлебные крошки" className="year-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={NUMEROLOGY_PATH}>Нумерология</Link><span aria-hidden="true">/</span><span>График судьбы</span></nav>
      <ThreadCalculator texts={texts} />
      <section className="year-guide" aria-labelledby="thread-guide-title">
        <div className="stack"><p className="eyebrow">Как читать нить</p><h2 id="thread-guide-title">Не прогноз.<br />Ритм жизни.</h2><p>В нумерологии годы идут девятилетними циклами: старт, терпение, самовыражение, фундамент, перемены, забота, осмысление, урожай, завершение. Нить складывает все ваши годы в одну линию, чтобы увидеть ритм: когда виден результат, а когда идёт тихая работа внутри.</p><p>Это символическая тема, а не предсказание событий: тихий год не хуже яркого, у каждого своя задача.</p></div>
        <div className="year-method stack"><h3>Открытая формула</h3><p>Цифры дня и месяца рождения плюс цифры года, сумма сворачивается до 1–9. Год считается от дня рождения до следующего.</p><p>Четыре периода жизни считаются по числам дня, месяца и года рождения; границы падают на день рождения.</p><p>Другие расчёты по той же дате: <Link href={PERSONAL_YEAR_PATH}>личный год 2027</Link> и <Link href={MATRIX_PATH}>матрица судьбы</Link>.</p></div>
      </section>
      <section className="year-faq" aria-labelledby="thread-faq-title"><p className="eyebrow">Вопросы</p><h2 id="thread-faq-title">О нити и личных годах</h2>{THREAD_FAQ.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
      <p className="muted year-footnote">Практика для самопознания. Решения о здоровье, деньгах и отношениях опирайте на факты и свою ситуацию.</p>
    </main>
  </>;
}
