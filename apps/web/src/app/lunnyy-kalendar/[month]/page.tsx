import { monthIntro } from "@oracle/content/moon-calendar";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoonLightCurve } from "@/components/moon/MoonLightCurve";
import { MoonMonthDays } from "@/components/moon/MoonMonthDays";
import { MoonMonthExplorer } from "@/components/moon/MoonMonthExplorer";
import { MoonSignRibbon } from "@/components/moon/MoonSignRibbon";
import { MoonTodayMark } from "@/components/moon/MoonTodayMark";
import { DISCLAIMER } from "@/lib/legal";
import { buildMonthPage, CURVE_HEIGHT, CURVE_WIDTH, isInWindow, MONTH_NAMES, monthWindow } from "@/lib/lunar-calendar";
import { lunarMonthPath, parseMonthSlug } from "@/lib/lunar-calendar-paths";
import { MOON_PATH } from "@/lib/moon-paths";
import { NATAL_PATH } from "@/lib/natal-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { TARO_DAY_PATH } from "@/lib/taro-paths";

type Params = { params: Promise<{ month: string }> };

// Страницы окна месяцев собираются заранее и обновляются раз в сутки: содержимое месяца от момента запроса не зависит,
// а «сегодня» и выбранный день ставит браузер. Прочие месяцы окна строятся по запросу (dynamicParams по умолчанию истинно), вне окна — 404
export const revalidate = 86400;

export function generateStaticParams() {
  return monthWindow(new Date()).map(({ year, month }) => ({ month: lunarMonthPath(year, month).split("/").pop()! }));
}

// Только точный слаг и только месяцы окна: иначе настоящий 404
function resolve(slug: string): { year: number; month: number } {
  const parsed = parseMonthSlug(slug);
  if (!parsed || !isInWindow(parsed.year, parsed.month, new Date())) notFound();
  return parsed;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { year, month } = resolve((await params).month);
  const name = `${MONTH_NAMES[month - 1]} ${year}`;
  return publicMetadata({
    title: `Лунный календарь на ${name}`,
    description: `Лунный календарь на ${name}: фазы Луны, лунные сутки, знак зодиака и время восхода по дням, новолуние и полнолуние по Москве. Бесплатно.`,
    path: lunarMonthPath(year, month),
  });
}

export default async function LunarMonthPage({ params }: Params) {
  const { year, month } = resolve((await params).month);
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
  const initialIndex = page.events.find((event) => event.kind === "full")?.dayIndex ?? 0;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
      <main className="moon-month">
        <MoonTodayMark year={year} month={month} />
        <nav aria-label="Хлебные крошки" className="moon-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={MOON_PATH}>Луна сегодня</Link><span aria-hidden="true">/</span><span>{page.title}</span></nav>
        <header className="moon-month__head">
          <h1>{page.title}</h1>
          <p className="moon-hero__place">По Москве</p>
          {intro && <p className="moon-month__intro">{intro}</p>}
        </header>
        <nav className="moon-month__nav" aria-label="Месяцы">
          {page.prev && <Link className="moon-month__prev" href={page.prev.href}>← {page.prev.label}</Link>}
          {page.next && <Link className="moon-month__next" href={page.next.href}>{page.next.label} →</Link>}
          <ul className="moon-month__list">
            {page.months.map((item) => <li key={item.href}><Link href={item.href} aria-current={item.current ? "page" : undefined}>{item.label}</Link></li>)}
          </ul>
        </nav>
        <MoonLightCurve curve={page.curve} width={CURVE_WIDTH} height={CURVE_HEIGHT} />
        <MoonMonthExplorer weeks={page.weeks} days={page.cells} events={page.events} initialIndex={initialIndex} />
        <MoonSignRibbon segments={page.ribbon} />
        <MoonMonthDays rows={page.rows} />
        {page.faq.length > 0 && (
          <section className="moon-faq" aria-labelledby="moon-month-faq-title">
            <h2 id="moon-month-faq-title">Вопросы о лунном календаре</h2>
            {page.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </section>
        )}
        <section className="moon-links" aria-labelledby="moon-month-links-title">
          <h2 id="moon-month-links-title">Продолжить</h2>
          <ul>
            <li><Link className="touch-link" href={MOON_PATH}>Луна сегодня</Link></li>
            <li><Link className="touch-link" href={TARO_DAY_PATH}>Вытянуть карту дня</Link></li>
            <li><Link className="touch-link" href={NATAL_PATH}>Какая Луна в вашей натальной карте</Link></li>
          </ul>
        </section>
        <p className="moon-disclaimer">{DISCLAIMER}</p>
      </main>
    </>
  );
}
