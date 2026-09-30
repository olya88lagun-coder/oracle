import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { FREE_MATRIX_CTA, FREE_RESULT_PROMISE, FREE_RESULT_TERMS, PRACTICES } from "@/lib/practices";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE, websiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Твой оракул — символические практики для самопознания",
  description: "Матрица судьбы, Лила, таро и натальная карта как инструмент самопознания — без обещаний предсказать будущее.",
  path: "/",
  absoluteTitle: true,
  image: SITE_PREVIEW_IMAGE,
});

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
          <ul className="practice-grid">
            {PRACTICES.map((practice) => (
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
                  {practice.href && <span className="button button--lavender practice-card__cta">{practice.slug === "matrix" ? "Рассчитать бесплатно" : "Играть бесплатно"}</span>}
                </div>
              </li>
            ))}
          </ul>
          <div className="home-start">
            <p className="lead">Начните с матрицы судьбы — бесплатно откроются три ключевые позиции: Личность, Центр и Задача.</p>
            <p>
              <Link className="button button--lavender" href={MATRIX_PATH}>
                {FREE_MATRIX_CTA}
              </Link>
            </p>
          </div>
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
      </div>
    </main>
  );
}
