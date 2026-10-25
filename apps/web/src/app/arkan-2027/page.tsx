import type { Metadata } from "next";
import Link from "next/link";
import { YearCalculator } from "@/components/year-arcana/YearCalculator";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { YEAR_FAQ, YEAR_PATH } from "@/lib/year-arcana";
import "./year.css";

export const metadata: Metadata = publicMetadata({
  title: "Аркан 2027 года по дате рождения — рассчитать бесплатно",
  description: "Рассчитайте личный аркан 2027 года по дате рождения и центру Матрицы судьбы. Бесплатная расшифровка, понятная формула и карточка для сохранения. Без регистрации.",
  path: YEAR_PATH,
  image: { url: "/images/matrix/matrix-stone.webp", alt: "Мой аркан 2027 — Твой оракул", width: 1536, height: 1024 },
});

export default function YearPage() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebApplication", name: "Мой аркан 2027 года", url: `${SITE_URL}${YEAR_PATH}`, applicationCategory: "LifestyleApplication", operatingSystem: "Web", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } },
      { "@type": "FAQPage", mainEntity: YEAR_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Твой оракул", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Мой аркан 2027 года", item: `${SITE_URL}${YEAR_PATH}` },
      ] },
    ],
  };
  return <main className="year-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
    <nav aria-label="Хлебные крошки" className="year-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><span>Аркан 2027</span></nav>
    <YearCalculator />
    <section className="year-guide" aria-labelledby="year-guide-title">
      <div className="stack"><p className="eyebrow">Как пользоваться результатом</p><h2 id="year-guide-title">Не готовый сценарий.<br />Повод выбрать своё.</h2><p>Аркан года — символическая тема для размышления о календарном 2027 годе. Прочитайте значение, отметьте, что откликается в вашей жизни, и выберите посильное действие. Вернитесь к вопросу через месяц: ответ может измениться вместе с вашим опытом.</p><p>Это не прогноз событий. Даже названия «Смерть», «Башня» или «Дьявол» не означают, что с вами случится несчастье. Мы рассматриваем их как образы перемен, пересмотра опор и собственных желаний.</p></div>
      <div className="year-method stack"><h3>Открытая формула</h3><p>Центр Матрицы + свёртка (день + месяц + 11). Итог снова сворачивается сложением цифр до 1–22. День берётся целиком.</p><p>Например, 14.03.1992: центр 13; 14 + 3 + 11 = 28 → 10; 13 + 10 = 23 → <strong>5, Иерофант</strong>.</p><p>Единой формулы у разных школ нет. Мы выбрали вариант с центром и используем ту же свёртку, что в <Link href={MATRIX_PATH}>нашей Матрице судьбы</Link>. Это отдельная практика, не возрастная линия Матрицы.</p><Link className="touch-link" href="/metodika">О текстах и методике сайта</Link></div>
    </section>
    <section className="year-faq" aria-labelledby="year-faq-title"><p className="eyebrow">Перед новым годом</p><h2 id="year-faq-title">Вопросы об аркане года</h2>{YEAR_FAQ.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
    <p className="muted year-footnote">Практика для самопознания. Решения о здоровье, деньгах и отношениях опирайте на факты и свою ситуацию.</p>
  </main>;
}
