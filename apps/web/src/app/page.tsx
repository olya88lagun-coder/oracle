import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LILA_SESSION_PRICE_KOPECKS, LILA_SESSION_PRODUCT, MATRIX_REPORT_PRICE_KOPECKS } from "@oracle/core";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { BLOG_PATH, BLOG_POSTS, blogPath } from "@/lib/blog";
import { formatRubles } from "@/lib/legal";
import { FREE_MATRIX_CTA, FREE_RESULT_PROMISE, FREE_RESULT_TERMS, PRACTICES } from "@/lib/practices";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE, websiteJsonLd } from "@/lib/seo";
import { salesEnabled } from "@/server/payments-deps";

export const metadata: Metadata = publicMetadata({
  title: "Твой оракул — символические практики для самопознания",
  description: "Матрица судьбы, Лила, таро и натальная карта как инструмент самопознания — без обещаний предсказать будущее.",
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
  ].filter((item): item is string => item !== null);
  return paid.length === 0 ? FREE_LINE : `${FREE_LINE} По желанию: ${paid.join(", ")}.`;
}

// Картинки заранее ужаты до нужного размера (webp) — оптимизатор Next не нужен, и в standalone-сборке не требуется sharp
export default function HomePage() {
  return (
    <main className="home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd()) }} />
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
            «Твой оракул» помогает исследовать личный вопрос через символы матрицы судьбы, Лилы, таро и натальной карты. Мы не предсказываем будущее —
            помогаем увидеть, что происходит сейчас.
          </p>
          <div className="hero__cta stack">
            <p>
              <Link className="button button--lavender" href={MATRIX_PATH}>
                {FREE_MATRIX_CTA}
              </Link>
            </p>
            <p className="hero__promise">
              {FREE_RESULT_PROMISE}
              <br />
              <span className="muted">{FREE_RESULT_TERMS}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="page page--wide stack">
        <section className="stack" aria-labelledby="practices">
          <h2 id="practices">Практики</h2>
          <p className="practices-note">{freePaidLine()}</p>
          <ul className="practice-grid">
            {OPEN.map((practice) => (
              <li key={practice.slug} className="practice-card">
                <Image className="practice-card__art" src={`/practices/${practice.slug}.webp`} alt="" fill unoptimized sizes="(min-width: 760px) 50vw, 100vw" />
                <div className="practice-card__body">
                  <span className={practice.href ? "tag tag--open" : "tag"}>{practice.href ? "Открыто" : "Скоро"}</span>
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
                  {practice.href && <span className="button button--lavender practice-card__cta">{practice.slug === "matrix" ? "Рассчитать бесплатно" : practice.slug === "compat" ? "Проверить бесплатно" : practice.slug === "tarot" ? "Вытянуть карту" : "Играть бесплатно"}</span>}
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

        <section className="card card--accent card--portrait stack">
          <div className="card__art">
            <Image src="/portrait.webp" alt="" fill unoptimized sizes="(min-width: 760px) 1360px, 100vw" />
          </div>
          <p className="eyebrow">Мой портрет</p>
          <h2>Одна дата рождения — для всех практик</h2>
          <p className="muted">
            Ваше личное пространство с результатами практик. Сохраните дату один раз: каждая новая практика откроется в портрете сразу, без повторного
            ввода.
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
