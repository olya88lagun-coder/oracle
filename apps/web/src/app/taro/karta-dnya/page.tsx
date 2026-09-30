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

const FACTS: readonly { value: string; text: string }[] = [
  { value: "1", text: "карта остаётся с вами до полуночи по Москве" },
  { value: "78", text: "карт Райдер–Уэйт с короткой трактовкой дня" },
  { value: "0", text: "регистраций и передачи личных данных" },
];

export default function TaroDayPage() {
  return (
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
      <p>
        <Link className="touch-link" href={TARO_PATH}>
          Значения всех 78 карт
        </Link>
      </p>
    </main>
  );
}
