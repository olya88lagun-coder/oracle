import { acceptedNumerologyPages, numerologyText } from "@oracle/content/numerology";
import { SQUARE_LINES } from "@oracle/core";
import type { Metadata } from "next";
import Link from "next/link";
import { PythagorasCalculator } from "@/components/numerology/PythagorasCalculator";
import { SquarePairLink } from "@/components/numerology/SquarePairLink";
import type { SquareSummaries } from "@/components/numerology/PythagorasResult";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { NUMEROLOGY_PATH } from "@/lib/numerology";
import { acceptedPairPaths, PYTHAGORAS_PATH, SQUARE_CELL_NAMES, SQUARE_FAQ, SQUARE_LINE_NAMES, SQUARE_LINES_PATH, squareCellPath, squareVariant } from "@/lib/pythagoras";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import "../../arkan-2027/year.css";
import "../numerology.css";

export const metadata: Metadata = publicMetadata({
  title: "Квадрат Пифагора по дате рождения — рассчитать",
  description: "Постройте квадрат Пифагора (психоматрицу) по дате рождения: четыре рабочих числа, девять ячеек и восемь линий с расшифровкой. Бесплатно и без регистрации.",
  path: PYTHAGORAS_PATH,
});

const firstParagraph = (text: ReturnType<typeof numerologyText>, title: string) => text?.sections.find((section) => section.title === title)?.paragraphs[0];

// Только принятые тексты: у непринятой ячейки в результате нет ни описания, ни ссылки
function acceptedSummaries(): SquareSummaries {
  const cells: Record<number, Record<string, string>> = {};
  for (const cell of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    const text = numerologyText("square", String(cell));
    if (!text) continue;
    cells[cell] = {};
    for (const count of [0, 1, 2, 3, 4, 5]) {
      const variant = squareVariant(cell, count);
      const paragraph = firstParagraph(text, variant.title);
      if (paragraph) cells[cell][variant.anchor] = paragraph;
    }
  }
  const linesText = numerologyText("square", "linii");
  const lines: Partial<Record<(typeof SQUARE_LINES)[number]["id"], string>> = {};
  for (const line of SQUARE_LINES) {
    const paragraph = firstParagraph(linesText, SQUARE_LINE_NAMES[line.id]);
    if (paragraph) lines[line.id] = paragraph;
  }
  return { cells, lines };
}

export default function PythagorasPage() {
  const accepted = new Set(acceptedNumerologyPages("square").map((page) => page.key));
  const fatePages = acceptedNumerologyPages("fate").map((page) => Number(page.key));
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebApplication", name: "Калькулятор квадрата Пифагора", url: `${SITE_URL}${PYTHAGORAS_PATH}`, applicationCategory: "LifestyleApplication", operatingSystem: "Web", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } },
      { "@type": "FAQPage", mainEntity: SQUARE_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Нумерология", item: `${SITE_URL}${NUMEROLOGY_PATH}` },
        { "@type": "ListItem", position: 2, name: "Квадрат Пифагора", item: `${SITE_URL}${PYTHAGORAS_PATH}` },
      ] },
    ],
  };
  // Крупная цифра «монеты» и под ней название мелко: длинное название крупным шрифтом не помещается на 375 px
  const tile = (key: string, label: string, name: string, href: string) => {
    const content = <>{label}<small className="numerology-square-tile__name">{name}</small></>;
    return <li key={key}>{accepted.has(key) ? <Link href={href}>{content}</Link> : <span title="Описание появится позже">{content}</span>}</li>;
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
    <main className="year-page numerology-page">
      <nav aria-label="Хлебные крошки" className="year-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={NUMEROLOGY_PATH}>Нумерология</Link><span aria-hidden="true">/</span><span>Квадрат Пифагора</span></nav>
      <PythagorasCalculator summaries={acceptedSummaries()} fatePages={fatePages} pairHref={acceptedPairPaths()[0]} />
      <section className="year-guide" aria-labelledby="square-guide-title">
        <div className="stack"><p className="eyebrow">Как читать результат</p><h2 id="square-guide-title">Не оценка.<br />Карта сильных сторон.</h2><p>Чем больше одинаковых цифр в ячейке, тем ярче её тема; пустая ячейка — не недостаток, а качество, которое проявляется иначе. Линии показывают, как темы складываются вместе.</p><p>Это символическая практика, а не психологический тест и не прогноз.</p></div>
        <div className="year-method stack"><h3>Открытая формула</h3><p>Пример — 14.05.1987: 1 + 4 + 0 + 5 + 1 + 9 + 8 + 7 = <strong>35</strong>; 3 + 5 = <strong>8</strong>; 35 − 2 × 1 = <strong>33</strong>; 3 + 3 = <strong>6</strong>. В квадрат идут цифры 14051987 и 35, 8, 33, 6, нули не учитываются.</p><p>Считаем всех по одной формуле Александрова, без «+19» для рождённых после 2000 года. По той же дате можно рассчитать <Link href={MATRIX_PATH}>матрицу судьбы</Link>.</p><Link className="touch-link" href={NUMEROLOGY_PATH}>Число судьбы по дате рождения</Link><SquarePairLink /></div>
      </section>
      <section className="year-catalog numerology-catalog" aria-labelledby="square-catalog-title">
        <p className="eyebrow">Все ячейки</p>
        <h2 id="square-catalog-title">Значения ячеек и линий</h2>
        <ul>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => tile(String(cell), String(cell), SQUARE_CELL_NAMES[cell] ?? "", squareCellPath(cell)))}{tile("linii", "3×3", "Линии", SQUARE_LINES_PATH)}</ul>
      </section>
      <section className="year-faq" aria-labelledby="square-faq-title"><p className="eyebrow">Вопросы</p><h2 id="square-faq-title">О квадрате Пифагора</h2>{SQUARE_FAQ.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
      <p className="muted year-footnote">Практика для самопознания. Решения о здоровье, деньгах и отношениях опирайте на факты и свою ситуацию.</p>
    </main>
  </>;
}
