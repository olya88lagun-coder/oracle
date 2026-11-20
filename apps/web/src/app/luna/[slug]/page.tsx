import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoonDisc } from "@/components/moon/MoonDisc";
import { MoonHead, MoonFaq, moonJsonLd } from "@/components/moon/MoonPageParts";
import { MoonHub } from "@/components/moon/MoonHub";
import { DISCLAIMER } from "@/lib/legal";
import { buildEclipsePage, buildRetroPage, type EclipsePage, type RetroPage } from "@/lib/moon-events";
import { buildPhasesPage, buildYearPage, type PhasesPage, type YearPage } from "@/lib/moon-year";
import { parseYearSlug, PHASES_PATH, PHASES_SLUG, YEAR_PAGE_KINDS, yearMoonPath, yearMoonSlug, yearWindow } from "@/lib/moon-year-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

// Фазы считаются от момента запроса («сейчас» и ближайшие четыре фазы), поэтому раз в час; таблицы лет от времени не зависят
export const revalidate = 3600;

export function generateStaticParams() {
  return [{ slug: PHASES_SLUG }, ...yearWindow(new Date()).flatMap((year) => YEAR_PAGE_KINDS.map((kind) => ({ slug: yearMoonSlug(kind, year) })))];
}

type Built = { type: "phases"; page: PhasesPage } | { type: "year"; page: YearPage } | { type: "eclipse"; page: EclipsePage } | { type: "retro"; page: RetroPage };

// Только слаг «фазы» или точный «вид-год» из окна лет: остальное настоящий 404
function build(slug: string, now: Date): { built: Built; path: string } {
  if (slug === PHASES_SLUG) return { built: { type: "phases", page: buildPhasesPage(now) }, path: PHASES_PATH };
  const parsed = parseYearSlug(slug);
  if (!parsed || !yearWindow(now).includes(parsed.year)) notFound();
  const { kind, year } = parsed;
  const path = yearMoonPath(kind, year);
  if (kind === "eclipse") return { built: { type: "eclipse", page: buildEclipsePage(year, now) }, path };
  if (kind === "mercury" || kind === "venus") return { built: { type: "retro", page: buildRetroPage(kind, year, now) }, path };
  return { built: { type: "year", page: buildYearPage(kind, year, now) }, path };
}

const PHASES_TITLE = "Фазы Луны";
const PHASES_DESCRIPTION = "Восемь фаз Луны, ближайшие новолуние, первая четверть, полнолуние и последняя четверть с точным временем по Москве. Бесплатно, без регистрации.";

const titleOf = (built: Built): string => (built.type === "phases" ? PHASES_TITLE : built.page.title);
const faqOf = (built: Built): readonly { question: string; answer: string }[] => built.page.faq;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { built, path } = build((await params).slug, new Date());
  if (built.type === "phases") return publicMetadata({ title: `${PHASES_TITLE}: восемь фаз и ближайшие переходы`, description: PHASES_DESCRIPTION, path });
  return publicMetadata({ title: `${built.page.title} года: даты и время по Москве`, description: built.page.description, path });
}

function YearsNav({ years }: { years: readonly { label: string; href: string; current: boolean }[] }) {
  return (
    <nav className="moon-month__nav" aria-label="Годы">
      <ul className="moon-month__list">
        {years.map((item) => <li key={item.href}><Link href={item.href} aria-current={item.current ? "page" : undefined}>{item.label}</Link></li>)}
      </ul>
    </nav>
  );
}

function YearView({ page }: { page: YearPage }) {
  const full = page.kind === "full";
  return (
    <>
      <MoonHead title={page.title} intro={page.intro} />
      <YearsNav years={page.years} />
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
      <MoonFaq id="moon-year-faq-title" title="Вопросы о Луне" items={page.faq} />
    </>
  );
}

function EclipseView({ page }: { page: EclipsePage }) {
  return (
    <>
      <MoonHead title={page.title} intro={page.intro} />
      <YearsNav years={page.years} />
      <section className="moon-days" aria-labelledby="moon-eclipse-table-title">
        <h2 id="moon-eclipse-table-title">Все затмения {page.year} года</h2>
        <div className="moon-days__scroll">
          <table className="moon-days__table">
            <caption className="visually-hidden">{page.title}: тип, момент максимума по Москве, знак Луны и видимость из Москвы</caption>
            <thead>
              <tr>
                <th scope="col">Момент максимума</th>
                <th scope="col">Тип</th>
                <th scope="col">Знак Луны</th>
                <th scope="col">Из Москвы</th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((row) => (
                <tr key={row.date} className="moon-days__row" data-date={row.date}>
                  <th scope="row"><time dateTime={row.date}>{row.label}</time></th>
                  <td>{row.kindName}</td>
                  <td>{row.signName}</td>
                  <td>{row.visibility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <MoonFaq id="moon-eclipse-faq-title" title="Вопросы о затмениях" items={page.faq} />
    </>
  );
}

function RetroView({ page }: { page: RetroPage }) {
  return (
    <>
      <MoonHead title={page.title} intro={page.intro} />
      <YearsNav years={page.years} />
      <section className="moon-days" aria-labelledby="moon-retro-table-title">
        <h2 id="moon-retro-table-title">Периоды обратного движения в {page.year} году</h2>
        {page.rows.length === 0 ? (
          <p className="moon-links__lead">В {page.year} году периодов обратного движения нет.</p>
        ) : (
          <div className="moon-days__scroll">
            <table className="moon-days__table">
              <caption className="visually-hidden">{page.title}: начало, конец, длительность и знаки зодиака</caption>
              <thead>
                <tr>
                  <th scope="col">Начало</th>
                  <th scope="col">Конец</th>
                  <th scope="col">Суток</th>
                  <th scope="col">Знак зодиака</th>
                </tr>
              </thead>
              <tbody>
                {page.rows.map((row) => (
                  <tr key={row.key} className="moon-days__row">
                    <th scope="row">{row.from}</th>
                    <td>{row.to}</td>
                    <td>{row.days}</td>
                    <td>{row.signs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <MoonFaq id="moon-retro-faq-title" title="Вопросы об обратном движении" items={page.faq} />
    </>
  );
}

function PhasesView({ page }: { page: PhasesPage }) {
  return (
    <>
      <MoonHead title={PHASES_TITLE} intro={page.intro} />
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
      <MoonFaq id="moon-phases-faq-title" title="Вопросы о фазах Луны" items={page.faq} />
    </>
  );
}

export default async function MoonYearPage({ params }: Params) {
  const now = new Date();
  const { built, path } = build((await params).slug, now);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(moonJsonLd(titleOf(built), path, faqOf(built))) }} />
      <main className="moon-month">
        {built.type === "phases" && <PhasesView page={built.page} />}
        {built.type === "year" && <YearView page={built.page} />}
        {built.type === "eclipse" && <EclipseView page={built.page} />}
        {built.type === "retro" && <RetroView page={built.page} />}
        <MoonHub now={now} current={path} id="moon-year-links-title" />
        <p className="moon-disclaimer">{DISCLAIMER}</p>
      </main>
    </>
  );
}
