import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbsJsonLd, faqPageJsonLd, TaroFaqSection } from "@/components/taro/TaroFaqSection";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { countLabel } from "@/lib/taro-catalog";
import { TARO_DAY_PATH, TARO_PATH, TARO_SPREADS_PATH } from "@/lib/taro-paths";
import { SPREADS_HUB_FAQ, spreadPath, TARO_SPREADS } from "@/lib/taro-spreads";

export const metadata: Metadata = publicMetadata({
  title: "Расклады Таро онлайн бесплатно — гадание без регистрации",
  description: "Бесплатные расклады Таро онлайн: на три карты, отношения, выбор, дело и деньги, на сегодня. Без регистрации, не прогноз.",
  path: TARO_SPREADS_PATH,
  image: SITE_PREVIEW_IMAGE,
});

export default function TaroSpreadsPage() {
  const breadcrumbs = breadcrumbsJsonLd([
    { name: "Таро", path: TARO_PATH },
    { name: "Расклады", path: TARO_SPREADS_PATH },
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faqPageJsonLd(SPREADS_HUB_FAQ)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
      <main className="page page--wide stack taro-page taro-spreads-page">
        <header className="taro-spreads-head">
          <p className="eyebrow eyebrow--line">Практика · таро</p>
          <h1 className="display">Расклады Таро онлайн</h1>
          <p className="lead">Выберите тему, вытяните карты и прочитайте, что каждая из них говорит в своей позиции. Это повод задать себе вопрос, а не прогноз.</p>
          <p className="muted">Бесплатно и без регистрации. Вопрос и карты остаются в вашем браузере.</p>
        </header>
        <ul className="taro-spreads">
          {TARO_SPREADS.map((spread) => (
            <li key={spread.slug}>
              <article className="taro-panel taro-spread-card">
                <p className="eyebrow">{countLabel(spread.positions.length)}</p>
                <h2>{spread.name}</h2>
                <p>{spread.teaser}</p>
                <ol className="taro-spread-card__positions">
                  {spread.positions.map((position) => (
                    <li key={position.title}>{position.title}</li>
                  ))}
                </ol>
                <Link className="button button--lavender" href={spreadPath(spread)} aria-label={`Сделать расклад: ${spread.name}`}>
                  Сделать расклад
                </Link>
              </article>
            </li>
          ))}
        </ul>
        <p className="taro-spreads-more">
          <Link className="touch-link" href={TARO_DAY_PATH}>
            Карта дня
          </Link>
          <Link className="touch-link" href={`${TARO_PATH}#znacheniya`}>
            Значения 78 карт
          </Link>
        </p>
        <TaroFaqSection id="spreads-faq" title="Частые вопросы о раскладах Таро" items={SPREADS_HUB_FAQ} />
      </main>
    </>
  );
}
