import type { Metadata } from "next";
import { drawCards } from "@/components/taro/draw-cards";
import { TaroDayGuide, taroDayBreadcrumbsJsonLd, taroDayFaqJsonLd } from "@/components/taro/TaroDayGuide";
import { TaroDraw } from "@/components/taro/TaroDraw";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { TARO_DAY_PATH } from "@/lib/taro-paths";

export const metadata: Metadata = publicMetadata({
  title: "Карта дня Таро на сегодня — гадание онлайн бесплатно",
  description: "Карта дня Таро онлайн бесплатно: выберите одну из трёх карт колоды Райдер–Уэйт и получите образ, действие на сегодня и вопрос для себя. Без регистрации.",
  path: TARO_DAY_PATH,
  image: SITE_PREVIEW_IMAGE,
});

const FACTS: readonly { value: string; text: string }[] = [
  { value: "1", text: "карта остаётся с вами до полуночи по Москве" },
  { value: "78", text: "карт Райдер–Уэйт с короткой трактовкой дня" },
  { value: "0", text: "регистраций и передачи личных данных" },
];

export default function TaroDayPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(taroDayFaqJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(taroDayBreadcrumbsJsonLd()) }} />
      <main className="page page--wide stack taro-page taro-day-page">
        <TaroDraw cards={drawCards()}>
          <p className="eyebrow eyebrow--line">Практика · таро</p>
          <h1 id="taro-day-title" className="display">
            Карта дня
          </h1>
          <p className="lead">Одна карта на сегодня. Не прогноз и не приговор, а образ, действие и вопрос, с которыми удобно пройти день.</p>
          <ul className="taro-facts" aria-label="Как работает карта дня">
            {FACTS.map((fact) => (
              <li key={fact.value}>
                <strong>{fact.value}</strong>
                <span>{fact.text}</span>
              </li>
            ))}
          </ul>
        </TaroDraw>
        <TaroDayGuide />
      </main>
    </>
  );
}
