import type { Metadata } from "next";
import { NatalCalculator } from "@/components/natal/NatalCalculator";
import { NatalSprite } from "@/components/natal/NatalSprite";
import { DISCLAIMER, NATAL_INTRO, NATAL_TITLE } from "@/lib/natal-copy";
import { NATAL_PATH } from "@/lib/natal-paths";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...publicMetadata({
    title: "Натальная карта онлайн по дате, времени и месту рождения",
    description:
      "Рассчитайте натальную карту: в каких знаках стояли Солнце, Луна и планеты, асцендент и дома. Считается в вашем браузере, без регистрации. Символический язык самопознания, а не предсказание.",
    path: NATAL_PATH,
  }),
  // Практика ещё не запущена: страница открыта по ссылке, но закрыта от поиска. Индексацию включает задача 8 плана 7
  // вместе с картой сайта, разделами шапки и подвала и меткой «Открыто» у практики на главной.
  robots: { index: false, follow: true },
};

export default function NatalPage() {
  return (
    <main>
      <header className="natal-intro">
        <h1>{NATAL_TITLE}</h1>
        <p>{NATAL_INTRO}</p>
      </header>
      {/* Спрайт глифов один на страницу: колесо, таблица и сводка ссылаются на него через <use> */}
      <NatalSprite />
      <NatalCalculator />
      <p className="natal-disclaimer">{DISCLAIMER}</p>
    </main>
  );
}
