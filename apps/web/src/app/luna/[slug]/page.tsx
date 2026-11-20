import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoonDisc } from "@/components/moon/MoonDisc";
import { MoonHub } from "@/components/moon/MoonHub";
import { DISCLAIMER } from "@/lib/legal";
import { MOON_PATH } from "@/lib/moon-paths";
import { buildPhasesPage, buildYearPage, type PhasesPage, type YearPage } from "@/lib/moon-year";
import { parseYearSlug, PHASES_PATH, PHASES_SLUG, yearMoonPath, yearMoonSlug, yearWindow } from "@/lib/moon-year-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

// Фазы считаются от момента запроса («сейчас» и ближайшие четыре фазы), поэтому раз в час; таблицы лет от времени не зависят
export const revalidate = 3600;

export function generateStaticParams() {
  return [{ slug: PHASES_SLUG }, ...yearWindow(new Date()).flatMap((year) => (["new", "full"] as const).map((kind) => ({ slug: yearMoonSlug(kind, year) })))];
}

// Только слаг «фазы» или точный «новолуния/полнолуния-год» из окна лет: остальное настоящий 404
function resolve(slug: string) {
  if (slug === PHASES_SLUG) return { type: "phases" as const };
  const parsed = parseYearSlug(slug);
  if (!parsed || !yearWindow(new Date()).includes(parsed.year)) notFound();
  return { type: "year" as const, ...parsed };
}

const PHASES_TITLE = "Фазы Луны";
const PHASES_DESCRIPTION = "Восемь фаз Луны, ближайшие новолуние, первая четверть, полнолуние и последняя четверть с точным временем по Москве. Бесплатно, без регистрации.";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = resolve((await params).slug);
  if (found.type === "phases") return publicMetadata({ title: `${PHASES_TITLE}: восемь фаз и ближайшие переходы`, description: PHASES_DESCRIPTION, path: PHASES_PATH });
  const page = buildYearPage(found.kind, found.year, new Date());
  return publicMetadata({ title: `${page.title} года: даты и время по Москве`, description: page.description, path: yearMoonPath(found.kind, found.year) });
}

function jsonLd(name: string, path: string, faq: readonly { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name, url: `${SITE_URL}${path}`, inLanguage: "ru" },
      ...(faq.length ? [{ "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }] : []),
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Твой оракул", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Луна сегодня", item: `${SITE_URL}${MOON_PATH}` },
        { "@type": "ListItem", position: 3, name, item: `${SITE_URL}${path}` },
      ] },
    ],
  };
}

function Head({ title, intro }: { title: string; intro: string | null }) {
  return (
    <>
      <nav aria-label="Хлебные крошки" className="moon-breadcrumb"><Link href="/">Главная</Link><span aria-hidden="true">/</span><Link href={MOON_PATH}>Луна сегодня</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
      <header className="moon-month__head">
        <h1>{title}</h1>
        <p className="moon-hero__place">По Москве</p>
        {intro && <p className="moon-month__intro">{intro}</p>}
      </header>
    </>
  );
}

function Faq({ id, title, items }: { id: string; title: string; items: readonly { question: string; answer: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="moon-faq" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {items.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
    </section>
  );
}

function YearView({ page }: { page: YearPage }) {
  const full = page.kind === "full";
  return (
    <>
      <Head title={page.title} intro={page.intro} />
      <nav className="moon-month__nav" aria-label="Годы">
        <ul className="moon-month__list">
          {page.years.map((item) => <li key={item.href}><Link href={item.href} aria-current={item.current ? "page" : undefined}>{item.label}</Link></li>)}
        </ul>
      </nav>
      <section className="moon-days" aria-labelledby="moon-year-table-title">
        <h2 id="moon-year-table-title">{full ? "Все полнолуния" : "Все новолуния"} {page.year} года</h2>
        <div className="moon-days__scroll">
          <table className="moon-days__table">
            <caption className="visually-hidden">{page.title}: время по Москве, знак Луны и расстояние до Земли</caption>
            <thead>
              <tr>
                <th scope="col">Дата и время</th>
                <th scope="col">Знак Луны в этот момент</th>
                <th scope="col">Расстояние до Земли</th>
                <th scope="col">Календарь месяца</th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((row) => (
                <tr key={row.date} className="moon-days__row" data-date={row.date}>
                  <th scope="row"><time dateTime={row.date}>{row.label}</time></th>
                  <td>{row.signName}</td>
                  <td>{row.distance}{row.superMoon && " · суперлуние"}</td>
                  <td>{row.monthHref ? <Link href={row.monthHref}>Открыть месяц</Link> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="moon-links__lead"><Link href={page.other.href}>{page.other.label}</Link></p>
      <Faq id="moon-year-faq-title" title="Вопросы о Луне" items={page.faq} />
    </>
  );
}

function PhasesView({ page }: { page: PhasesPage }) {
  return (
    <>
      <Head title={PHASES_TITLE} intro={page.intro} />
      <p className="moon-month__intro">Сейчас: {page.now.phaseName}. Освещено {page.now.percent} %, Луна {page.now.signLocative}.</p>
      <section className="moon-phases" aria-labelledby="moon-phases-title">
        <h2 id="moon-phases-title">Восемь фаз за лунный цикл</h2>
        <ol className="moon-phases__row">
          {page.schema.map((item) => (
            <li key={item.phase} className="moon-phases__item" aria-current={item.current ? "true" : undefined}>
              <MoonDisc size="mini" illumination={item.illumination} waxing={item.waxing} phase={item.phase} />
              <span>{item.name}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="moon-events" aria-labelledby="moon-phases-next-title">
        <h2 id="moon-phases-next-title">Ближайшие главные фазы</h2>
        <p className="moon-events__note">Время по Москве.</p>
        <ol className="moon-events__list">
          {page.upcoming.map((item) => (
            <li key={item.date + item.name} className="moon-events__item moon-events__item--phase">
              <time dateTime={item.date}>{item.label}</time>
              <span>{item.name}</span>
            </li>
          ))}
        </ol>
      </section>
      {page.cards.length > 0 && (
        <section className="moon-phases" aria-labelledby="moon-phases-cards-title">
          <h2 id="moon-phases-cards-title">Что говорит о каждой фазе традиция</h2>
          {page.cards.map((card) => (
            <article key={card.phase} className="moon-text__block" data-phase={card.phase}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <p className="moon-text__question">{card.question}</p>
            </article>
          ))}
        </section>
      )}
      <Faq id="moon-phases-faq-title" title="Вопросы о фазах Луны" items={page.faq} />
    </>
  );
}

export default async function MoonYearPage({ params }: Params) {
  const found = resolve((await params).slug);
  const now = new Date();
  const phases = found.type === "phases" ? buildPhasesPage(now) : null;
  const year = found.type === "year" ? buildYearPage(found.kind, found.year, now) : null;
  const path = found.type === "phases" ? PHASES_PATH : yearMoonPath(found.kind, found.year);
  const name = phases ? PHASES_TITLE : year!.title;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd(name, path, (phases ?? year)!.faq)) }} />
      <main className="moon-month">
        {phases ? <PhasesView page={phases} /> : <YearView page={year!} />}
        <MoonHub now={now} current={path} id="moon-year-links-title" />
        <p className="moon-disclaimer">{DISCLAIMER}</p>
      </main>
    </>
  );
}
