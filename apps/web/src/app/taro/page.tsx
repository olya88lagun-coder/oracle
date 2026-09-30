import type { Metadata } from "next";
import Link from "next/link";
import { TaroGuide, taroFaqJsonLd } from "@/components/taro/TaroGuide";
import { TaroIndex } from "@/components/taro/TaroIndex";
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
    <main className="page page--wide stack taro-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(taroFaqJsonLd()) }} />
      <div className="stack">
        <p className="eyebrow eyebrow--line">Практика · таро</p>
        <h1 className="display">Таро и карта дня</h1>
        <p className="lead">Карта Таро — образ, с которым удобно посмотреть на свой день. Без предсказаний: символ, вопрос и небольшое действие.</p>
      </div>
      <section className="card card--accent stack" aria-labelledby="taro-day-cta">
        <h2 id="taro-day-cta">Карта дня</h2>
        <p>Одна карта на сегодня: значение, действие и вопрос для себя. Выбор происходит в вашем браузере.</p>
        <p>
          <Link className="button button--lavender" href={TARO_DAY_PATH}>
            Вытянуть карту дня
          </Link>
        </p>
      </section>
      <TaroIndex />
      <TaroGuide />
    </main>
  );
}
