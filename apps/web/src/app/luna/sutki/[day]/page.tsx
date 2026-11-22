import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MoonRibbon } from "@/components/moon/MoonRibbon";
import { notFound } from "next/navigation";
import { MoonHub } from "@/components/moon/MoonHub";
import { moonJsonLd } from "@/components/moon/MoonPageParts";
import { DISCLAIMER } from "@/lib/legal";
import { buildDayPage, dayOrdinal } from "@/lib/moon-events";
import { MOON_PATH } from "@/lib/moon-paths";
import { dayPath, DAYS_PATH, LUNAR_DAYS, parseDay } from "@/lib/moon-year-paths";
import { lunarDayImage } from "@/lib/moon-images";
import { jsonLdScript, publicMetadata } from "@/lib/seo";

type Params = { params: Promise<{ day: string }> };

// Даты «ближайшие» считаются от сегодняшнего дня, поэтому раз в сутки
export const revalidate = 86400;

export function generateStaticParams() {
  return Array.from({ length: LUNAR_DAYS }, (_, index) => ({ day: String(index + 1) }));
}

// Только «1»…«30»: остальное настоящий 404
function resolve(value: string): number {
  const day = parseDay(value);
  if (day === null) notFound();
  return day;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const day = resolve((await params).day);
  const { symbol } = buildDayPage(day, new Date());
  const art = lunarDayImage(day, 960);
  return publicMetadata({
    title: `${dayOrdinal(day)} лунные сутки: «${symbol}»`,
    description: `${dayOrdinal(day)} лунные сутки: символ «${symbol}», образ, вопрос к себе, на какие фазы Луны обычно приходятся и ближайшие даты по Москве. Бесплатно.`,
    path: dayPath(day),
    ...(art && { image: { url: art, alt: `Гравюра суток: «${symbol}»` } }),
  });
}

export default async function LunarDayPage({ params }: Params) {
  const day = resolve((await params).day);
  const now = new Date();
  const page = buildDayPage(day, now);
  const title = `${dayOrdinal(day)} лунные сутки: «${page.symbol}»`;
  const path = dayPath(day);
  const art = lunarDayImage(day, 480);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(moonJsonLd(title, path, [])) }} />
      <main className="moon-month">
        <MoonRibbon current="days" now={now} />
        <nav aria-label="Хлебные крошки" className="moon-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={MOON_PATH}>Луна сегодня</Link><span aria-hidden="true">/</span><Link href={DAYS_PATH}>Лунные сутки</Link><span aria-hidden="true">/</span><span>{dayOrdinal(day)} сутки</span></nav>
        <header className="moon-month__head moon-day-head">
          {art && (
            <div className="moon-day-head__art">
              <Image src={art} alt={`Гравюра суток: «${page.symbol}»`} width={480} height={480} unoptimized priority sizes="(min-width: 700px) 220px, 180px" />
            </div>
          )}
          <div className="moon-day-head__text">
            <h1>{title}</h1>
            <p className="moon-hero__place">По Москве</p>
            {page.note && <p className="moon-month__intro">{page.note}</p>}
          </div>
        </header>
        <div className="moon-day-reading">
        {page.text && (
          <section className="moon-text" aria-labelledby="moon-day-text-title">
            <h2 id="moon-day-text-title">Образ суток</h2>
            <article className="moon-text__block">
              <p>{page.text}</p>
              {page.question && <p className="moon-text__question">{page.question}</p>}
            </article>
          </section>
        )}
        <section className="moon-days" aria-labelledby="moon-day-facts-title">
          <h2 id="moon-day-facts-title">Что показывает расчёт</h2>
          <dl className="moon-day-facts">
            <dt>Обычно приходятся на фазы</dt>
            <dd>{page.phases}</dd>
            <dt>Освещённость в середине суток</dt>
            <dd>около {page.illumination} %</dd>
            <dt>Ближайшие даты по Москве (на полдень)</dt>
            <dd>
              {page.dates.length === 0
                ? "—"
                : page.dates.map((item, index) => (
                    <span key={item.label}>
                      {index > 0 && "; "}
                      {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
                    </span>
                  ))}
            </dd>
          </dl>
        </section>
        </div>
        <nav className="moon-links moon-links--pager" aria-label="Соседние сутки">
          <ul>
            {page.prev && <li><Link href={page.prev.href} rel="prev">← {page.prev.label}</Link></li>}
            {page.next && <li><Link href={page.next.href} rel="next">{page.next.label} →</Link></li>}
            <li><Link href={DAYS_PATH}>Все лунные сутки</Link></li>
          </ul>
        </nav>
        <MoonHub now={now} current={path} id="moon-day-links-title" />
        <p className="moon-disclaimer">{DISCLAIMER}</p>
      </main>
    </>
  );
}
