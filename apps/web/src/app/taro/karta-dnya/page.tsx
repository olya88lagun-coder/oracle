import type { Metadata } from "next";
import Link from "next/link";
import { drawCards } from "@/components/taro/draw-cards";
import { TaroDraw } from "@/components/taro/TaroDraw";
import { publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { TARO_DAY_PATH, TARO_PATH } from "@/lib/taro-paths";

export const metadata: Metadata = publicMetadata({
  title: "Карта дня онлайн — вытяните карту Таро на сегодня",
  description: "Вытяните карту дня из колоды Райдер–Уэйт: значение, действие на сегодня и вопрос для себя. Бесплатно, без регистрации, выбор остаётся в вашем браузере.",
  path: TARO_DAY_PATH,
  image: SITE_PREVIEW_IMAGE,
});

export default function TaroDayPage() {
  return (
    <main className="page stack taro-page taro-day-page">
      <div className="stack">
        <p className="eyebrow eyebrow--line">Практика · таро</p>
        <h1 className="display">Карта дня</h1>
        <p className="lead">Одна карта на сегодня. Это не предсказание, а образ и вопрос, с которыми удобно прожить день. Смена карты — в полночь по московскому времени.</p>
      </div>
      <TaroDraw cards={drawCards()} />
      <p>
        <Link className="touch-link" href={TARO_PATH}>
          Значения всех 78 карт
        </Link>
      </p>
    </main>
  );
}
