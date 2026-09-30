import type { Metadata } from "next";
import Link from "next/link";
import { catalogCards } from "@/components/taro/catalog-cards";
import { TaroCatalog } from "@/components/taro/TaroCatalog";
import { TaroGuide, taroFaqJsonLd } from "@/components/taro/TaroGuide";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { TARO_DAY_PATH, TARO_PATH } from "@/lib/taro-paths";

export const metadata: Metadata = publicMetadata({
  title: "Таро онлайн — карта дня и значения всех 78 карт",
  description: "Вытяните карту дня и прочитайте значения всех 78 карт колоды Райдер–Уэйт: в отношениях, в деле и деньгах. Без регистрации, выбор остаётся в вашем браузере.",
  path: TARO_PATH,
  image: SITE_PREVIEW_IMAGE,
});

export default function TaroPage() {
  return (
    <main className="taro-cat-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(taroFaqJsonLd()) }} />

      <section className="taro-cat-hero" aria-labelledby="taro-title">
        <picture className="taro-cat-hero__art">
          <source media="(max-width: 700px)" srcSet="/images/taro/tarot-hero-mobile.webp" />
          {/* Декоративная сцена: пустой alt. Первый экран страницы, поэтому грузится с приоритетом */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/taro/tarot-hero.webp" alt="" width={1536} height={1024} fetchPriority="high" />
        </picture>
        <div className="matrix-wrap taro-cat-hero__inner">
          <div className="taro-cat-hero__copy">
            <h1 id="taro-title" className="display">
              Таро <span>и карта дня</span>
            </h1>
            <p className="lead">Один образ, вопрос и небольшое действие. Посмотрите на свой день через символы классической колоды Райдер–Уэйт.</p>
            <div className="taro-cat-hero__actions">
              <Link className="button button--lavender" href={TARO_DAY_PATH}>
                Вытянуть карту дня
              </Link>
              <a className="matrix-link" href="#znacheniya">
                Значения 78 карт
              </a>
            </div>
            <p className="taro-cat-hero__note">Без регистрации. Выбор остаётся в вашем браузере.</p>
          </div>
        </div>
      </section>

      <TaroCatalog cards={catalogCards()} />

      <div className="matrix-method-band">
        <section className="matrix-wrap taro-about" aria-labelledby="taro-about">
          <h2 id="taro-about">
            78 образов. <em>Ваш собственный отклик.</em>
          </h2>
          <div>
            <p>22 старших аркана говорят о больших жизненных темах. 56 младших — о повседневном опыте, чувствах, решениях и действиях.</p>
            <p>У каждого образа есть ресурс и сложная сторона. Трактовка помогает заметить что-то своё и задать себе вопрос.</p>
            <p className="taro-about__note">Мы не используем Таро для предсказаний.</p>
          </div>
        </section>
      </div>

      <TaroGuide />

      <section className="matrix-wrap matrix-cta" aria-labelledby="taro-cta">
        <div>
          <h2 id="taro-cta">Одна карта на сегодня.</h2>
          <p>Образ, действие и вопрос для себя.</p>
        </div>
        <Link className="button button--lavender" href={TARO_DAY_PATH}>
          Вытянуть карту дня
        </Link>
      </section>
    </main>
  );
}
