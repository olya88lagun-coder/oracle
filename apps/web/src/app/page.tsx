import type { Metadata } from "next";
import "@/app/home-intents.css";
import Image from "next/image";
import Link from "next/link";
import { LILA_SESSION_PRICE_KOPECKS, LILA_SESSION_PRODUCT, MATRIX_REPORT_PRICE_KOPECKS, NATAL_REPORT_PRICE_KOPECKS, NATAL_REPORT_PRODUCT, THREAD_REPORT_PRICE_KOPECKS, THREAD_REPORT_PRODUCT } from "@oracle/core";
import { HomeDateStart } from "@/components/HomeDateStart";
import { MoonTile } from "@/components/moon/MoonTile";
import { ThreadPromo } from "@/components/numerology/ThreadPromo";
import { YearPromo } from "@/components/year-arcana/YearPromo";
import { BLOG_PATH, BLOG_POSTS, blogPath } from "@/lib/blog";
import { formatRubles } from "@/lib/legal";
import { HOME_INTENTS, HOME_INTENTS_LEAD, HOME_INTENTS_TITLE } from "@/lib/home-intents";
import { HOME_PRINCIPLES, HOME_PRINCIPLES_TITLE } from "@/lib/home-principles";
import { buildMoonTile } from "@/lib/moon-tile";
import { acceptedThreadPaths } from "@/lib/numerology-pages";
import { FREE_RESULT_PROMISE, FREE_RESULT_TERMS, PRACTICES } from "@/lib/practices";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE, websiteJsonLd } from "@/lib/seo";
import { salesEnabled } from "@/server/payments-deps";

export const metadata: Metadata = publicMetadata({
  title: "Твой оракул — символические практики для самопознания",
  description: "Матрица судьбы, совместимость, Лила, таро и натальная карта как инструменты самопознания — без обещаний предсказать будущее.",
  path: "/",
  absoluteTitle: true,
  image: SITE_PREVIEW_IMAGE,
});

const OPEN = PRACTICES.filter((practice) => practice.href);
const SOON = PRACTICES.filter((practice) => !practice.href);
const LATEST_POSTS = BLOG_POSTS.slice(0, 3);
const formatPostDate = (iso: string): string => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

// Платные предложения в строке «что бесплатно, что платно» показываются только при включённой продаже: флаги читаются во время запроса, а не сборки
export const dynamic = "force-dynamic";

const FREE_LINE = "Бесплатно: расчёт трёх ключевых позиций матрицы, совместимость, карта дня и Лила без проводника.";

function freePaidLine(): string {
  const paid = [
    salesEnabled() ? `полный разбор матрицы — ${formatRubles(MATRIX_REPORT_PRICE_KOPECKS)}` : null,
    salesEnabled(LILA_SESSION_PRODUCT) ? `Лила с ИИ-проводником — ${formatRubles(LILA_SESSION_PRICE_KOPECKS)}` : null,
    salesEnabled(NATAL_REPORT_PRODUCT) ? `разбор натальной карты — ${formatRubles(NATAL_REPORT_PRICE_KOPECKS)}` : null,
    salesEnabled(THREAD_REPORT_PRODUCT) ? `разбор нити — ${formatRubles(THREAD_REPORT_PRICE_KOPECKS)}` : null,
  ].filter((item): item is string => item !== null);
  return paid.length === 0 ? FREE_LINE : `${FREE_LINE} По желанию: ${paid.join(", ")}.`;
}

// Картинки заранее ужаты до нужного размера (webp) — оптимизатор Next не нужен, и в standalone-сборке не требуется sharp
export default function HomePage() {
  return (
    <main className="home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd()) }} />
      {/* Декоративная нить у левого края: рисуется при прокрутке (CSS), только на широком экране */}
      <svg className="page-thread-line" viewBox="0 0 24 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {/* Одна кривая в четыре слоя: дорожка, два слоя свечения и яркое ядро (стили — .page-thread-line__* в globals.css) */}
        {(["track", "halo", "glow", "core"] as const).map((layer) => (
          <path key={layer} className={`page-thread-line__${layer}`} d="M12 0 C 5 120, 19 240, 12 360 S 5 600, 12 720 S 19 880, 12 1000" pathLength="1" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <section className="hero">
        <div className="hero__art">
          <Image src="/hero.webp" alt="" fill priority unoptimized sizes="100vw" />
        </div>
        <div className="hero__text">
          <p className="eyebrow">Символические практики · самопознание</p>
          <h1 className="display">
            Иногда нужен не&nbsp;ответ.
            <br />А другой взгляд.
          </h1>
          <p className="lead">
            «Твой оракул» помогает исследовать личный вопрос через символы матрицы судьбы, Лилы, совместимости и таро. Мы не предсказываем будущее —
            помогаем увидеть, что происходит сейчас.
          </p>
          <div className="hero__cta stack">
            <HomeDateStart />
            <p className="hero__promise">
              {FREE_RESULT_PROMISE}
              <br />
              <span className="muted">{FREE_RESULT_TERMS}</span>
            </p>
            <a className="matrix-link hero__all" href="#practices">
              Все практики
            </a>
          </div>
        </div>
      </section>

      <div className="page page--wide stack">
        <section className="home-intents" aria-labelledby="home-intents">
          <div className="home-intents__intro">
            <h2 id="home-intents">{HOME_INTENTS_TITLE}</h2>
            <p>{HOME_INTENTS_LEAD}</p>
          </div>
          <ul className="home-intents__list">
            {HOME_INTENTS.map((intent) => (
              <li key={intent.title}>
                <Link className="home-intents__link" href={intent.href} aria-label={`Начать: ${intent.title.toLowerCase()}`}>
                  <h3>{intent.title}</h3>
                  <p>{intent.text}</p>
                  <span className="home-intents__action" aria-hidden="true">
                    Начать
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" focusable="false">
                      <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <MoonTile data={buildMoonTile(new Date())} />

        <section className="stack" aria-labelledby="practices">
          <h2 id="practices">Практики</h2>
          <p className="practices-note">{freePaidLine()}</p>
          <ul className="practice-grid">
            {OPEN.map((practice) => (
              <li key={practice.slug} className="practice-card practice-card--open">
                <Image className="practice-card__art" src={`/practices/${practice.slug}.webp`} alt="" fill unoptimized sizes="(min-width: 760px) 50vw, 100vw" />
                <div className="practice-card__body">
                  <h3>
                    {practice.href ? (
                      <Link className="practice-card__link" href={practice.href}>
                        {practice.title}
                      </Link>
                    ) : (
                      practice.title
                    )}
                  </h3>
                  <p>{practice.summary}</p>
                  {/* Вся карточка — ссылка (растянутая practice-card__link); это надпись-подсказка, а не вторая ссылка */}
                  {practice.href && <span className="button button--lavender practice-card__cta">{practice.slug === "matrix" || practice.slug === "natal" || practice.slug === "numerology" ? "Рассчитать бесплатно" : practice.slug === "compat" ? "Проверить бесплатно" : practice.slug === "tarot" ? "Вытянуть карту" : "Играть бесплатно"}</span>}
                </div>
              </li>
            ))}
          </ul>
          {SOON.length > 0 && (
            <ul className="practice-soon" aria-label="Скоро">
              {SOON.map((practice) => (
                <li key={practice.slug}>
                  <span className="tag practice-soon__tag">Скоро</span>
                  <div>
                    <h3>{practice.title}</h3>
                    <p>{practice.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <YearPromo context="home" id="home-year" />
        {acceptedThreadPaths().length > 0 && <ThreadPromo id="home-thread" />}

        <section className="stack home-principles" aria-labelledby="home-principles">
          <h2 id="home-principles">{HOME_PRINCIPLES_TITLE}</h2>
          <ul className="home-principles__list">
            {HOME_PRINCIPLES.map((item) => (
              <li key={item.title} className="home-principles__item">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                {item.href && (
                  <Link className="matrix-link" href={item.href}>
                    {item.linkLabel}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="card card--accent card--portrait stack">
          <div className="card__art">
            <Image src="/portrait.webp" alt="" fill unoptimized sizes="(min-width: 760px) 1360px, 100vw" />
          </div>
          <p className="eyebrow">Мой портрет</p>
          <h2>Ваши сохранённые практики</h2>
          <p className="muted">
            Сохраните свою дату для матрицы, партии Лилы и купленные разборы в одном личном пространстве. Вернуться к ним можно после входа через VK ID.
          </p>
          <p>
            <Link className="button" href="/portret">
              Открыть портрет
            </Link>
          </p>
        </section>

        <section className="stack home-blog" aria-labelledby="home-blog">
          <div className="home-blog__head">
            <h2 id="home-blog">Из блога</h2>
            <Link className="matrix-link" href={BLOG_PATH}>
              Все статьи
            </Link>
          </div>
          <ul className="home-blog__list">
            {LATEST_POSTS.map((post) => (
              <li key={post.slug}>
                <Link href={blogPath(post)} className="home-blog__card">
                  <span className="home-blog__art">
                    <Image src={post.image.url} alt="" fill unoptimized sizes="(min-width: 860px) 360px, 100vw" />
                  </span>
                  <span className="home-blog__title">{post.title}</span>
                  <span className="home-blog__date">{formatPostDate(post.published)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
