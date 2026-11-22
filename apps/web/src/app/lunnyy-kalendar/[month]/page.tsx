import { monthIntro } from "@oracle/content/moon-calendar";
import type { Metadata } from "next";
import Link from "next/link";
import { MoonRibbon } from "@/components/moon/MoonRibbon";
import { notFound } from "next/navigation";
import { MoonHub } from "@/components/moon/MoonHub";
import { MoonCollection } from "@/components/moon/MoonCollection";
import { MoonDatePage } from "@/components/moon/MoonDatePage";
import { moonJsonLd } from "@/components/moon/MoonPageParts";
import { MoonMonthPlace, MoonMonthRowsPlace, MoonPlaceLine } from "@/components/moon/MoonMonthPlace";
import { MoonNatalBridge } from "@/components/moon/MoonNatalBridge";
import { NatalSprite } from "@/components/natal/NatalSprite";
import { WeekdayRibbon } from "@/components/weekday/WeekdayRibbon";
import { DISCLAIMER } from "@/lib/legal";
import { buildMonthPage, isInWindow, MONTH_NAMES, monthWindow } from "@/lib/lunar-calendar";
import { lunarDayPath, lunarMonthPath, parseDaySlug, parseMonthSlug } from "@/lib/lunar-calendar-paths";
import { dateDescription, dateFaq, dateTitle } from "@/lib/lunar-day-copy";
import { buildDatePage } from "@/lib/lunar-day-page";
import { collectionItems } from "@/lib/moon-collection-items";
import { phaseImage } from "@/lib/moon-images";
import { MOON_PATH } from "@/lib/moon-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

type Params = { params: Promise<{ month: string }> };

// Страницы окна месяцев собираются заранее и обновляются раз в сутки: содержимое месяца от момента запроса не зависит,
// а «сегодня» и выбранный день ставит браузер. Прочие месяцы окна строятся по запросу (dynamicParams по умолчанию истинно), вне окна — 404
export const revalidate = 86400;

export function generateStaticParams() {
  return monthWindow(new Date()).map(({ year, month }) => ({ month: lunarMonthPath(year, month).split("/").pop()! }));
}

// Дата («24-noyabrya-2026») или месяц («noyabr-2026»): страницы дней строятся по запросу и обновляются раз в сутки
// Только дни месяцев окна: иначе настоящий 404
function resolveDay(slug: string): { year: number; month: number; day: number } | null {
  const parsed = parseDaySlug(slug);
  if (!parsed) return null;
  if (!isInWindow(parsed.year, parsed.month, new Date())) notFound();
  return parsed;
}

// Только точный слаг и только месяцы окна: иначе настоящий 404
function resolve(slug: string): { year: number; month: number } {
  const parsed = parseMonthSlug(slug);
  if (!parsed || !isInWindow(parsed.year, parsed.month, new Date())) notFound();
  return parsed;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = (await params).month;
  const date = resolveDay(slug);
  if (date) {
    const page = buildDatePage(date.year, date.month, date.day, new Date());
    const preview = phaseImage(page.phase);
    return publicMetadata({
      ...(preview && { image: { url: preview, alt: `Луна ${page.dateLabel}: ${page.phaseName}` } }),
      title: dateTitle(page),
      description: dateDescription(page),
      path: lunarDayPath(date.year, date.month, date.day),
    });
  }
  const { year, month } = resolve(slug);
  const name = `${MONTH_NAMES[month - 1]} ${year}`;
  const art = phaseImage("full");
  return publicMetadata({
    ...(art && { image: { url: art, alt: `Лунный календарь на ${name}: полнолуние` } }),
    title: `Лунный календарь на ${name}`,
    description: `Лунный календарь на ${name}: фазы Луны, лунные сутки, знак зодиака и время восхода по дням, новолуние и полнолуние по Москве. Бесплатно.`,
    path: lunarMonthPath(year, month),
  });
}

export default async function LunarMonthPage({ params }: Params) {
  const slug = (await params).month;
  const date = resolveDay(slug);
  if (date) {
    const now = new Date();
    const page = buildDatePage(date.year, date.month, date.day, now);
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(moonJsonLd(dateTitle(page), lunarDayPath(date.year, date.month, date.day), dateFaq(page))) }} />
        <MoonDatePage page={page} now={now} />
      </>
    );
  }
  const { year, month } = resolve(slug);
  const page = buildMonthPage(year, month, new Date());
  const intro = monthIntro();
  const path = lunarMonthPath(year, month);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: page.title, url: `${SITE_URL}${path}`, inLanguage: "ru" },
      ...(page.faq.length ? [{ "@type": "FAQPage", mainEntity: page.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }] : []),
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Твой оракул", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Луна сегодня", item: `${SITE_URL}${MOON_PATH}` },
        { "@type": "ListItem", position: 3, name: page.title, item: `${SITE_URL}${path}` },
      ] },
    ],
  };
  // Для статичной страницы первый выбор — день первого полнолуния месяца; в текущем месяце браузер переведёт его на сегодняшний день
  // В браузер уходит только то, что зависит от города: остальное (FAQ, тексты, ссылки) остаётся серверным
  const stageData = { cells: page.cells, weeks: page.weeks, events: page.events, curve: page.curve, ribbon: page.ribbon, afterMonth: page.afterMonth, rows: page.rows, guide: page.guide };
  const initialIndex = page.events.find((event) => event.kind === "full")?.dayIndex ?? 0;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
      <main className="moon-month">
        <MoonRibbon current="calendar" now={new Date()} />
        <NatalSprite />
        <nav aria-label="Хлебные крошки" className="moon-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={MOON_PATH}>Луна сегодня</Link><span aria-hidden="true">/</span><span>{page.title}</span></nav>
        <header className="moon-month__head moon-month__head--compact">
          <h1>{page.title}</h1>
          <MoonPlaceLine year={year} month={month} />
        </header>
        <nav className="moon-month__nav" aria-label="Месяцы">
          {page.prev && <Link className="moon-month__prev" href={page.prev.href}>← {page.prev.label}</Link>}
          {page.next && <Link className="moon-month__next" href={page.next.href}>{page.next.label} →</Link>}
          <ul className="moon-month__list">
            {page.months.map((item) => <li key={item.href}><Link href={item.href} aria-current={item.current ? "page" : undefined}>{item.label}</Link></li>)}
          </ul>
        </nav>
        <MoonMonthPlace year={year} month={month} initial={stageData} initialIndex={initialIndex} />
        <MoonCollection items={collectionItems()} days={page.cells.map(({ date, sign, phase }) => ({ date, sign, phase }))} />
        <MoonNatalBridge from="month" />
        {(intro || page.summary) && (
          <details className="moon-fold" id="moon-about">
            <summary>О календаре на {MONTH_NAMES[month - 1]} {year}</summary>
            {intro && <p className="moon-month__intro">{intro}</p>}
            {page.summary && <p className="moon-month__intro">{page.summary}</p>}
          </details>
        )}
        <details className="moon-fold" id="moon-days-data">
          <summary>Данные по дням таблицей</summary>
          <MoonMonthRowsPlace year={year} month={month} initial={stageData} />
        </details>
        <WeekdayRibbon />
        {page.faq.length > 0 && (
          <section className="moon-faq" id="moon-month-faq" aria-labelledby="moon-month-faq-title">
            <h2 id="moon-month-faq-title">Вопросы о лунном календаре</h2>
            {page.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </section>
        )}
        <MoonHub now={new Date()} current={path} id="moon-month-links-title" />
        <p className="moon-disclaimer">{DISCLAIMER}</p>
      </main>
    </>
  );
}
