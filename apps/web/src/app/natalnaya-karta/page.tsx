import { toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import { NatalCalculator } from "@/components/natal/NatalCalculator";
import { NatalSprite } from "@/components/natal/NatalSprite";
import { DISCLAIMER, NATAL_INTRO, NATAL_TITLE } from "@/lib/natal-copy";
import { NATAL_PATH } from "@/lib/natal-paths";
import type { SavedBirth } from "@/lib/natal-save";
import { publicMetadata } from "@/lib/seo";
import { getDb } from "@/server/db";
import { loadPortrait } from "@/server/profile-service";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = publicMetadata({
  title: "Натальная карта онлайн по дате, времени и месту рождения",
  description:
    "Рассчитайте натальную карту: в каких знаках стояли Солнце, Луна и планеты, асцендент и дома. Считается в вашем браузере, без регистрации. Символический язык самопознания, а не предсказание.",
  path: NATAL_PATH,
});

// Страница зависит от входа: у вошедшего форма заполняется данными из портрета, а «Сохранить в портрет» работает без перехода
export default async function NatalPage() {
  const user = await currentUser();
  const portrait = user ? await loadPortrait({ db: getDb(), now: () => new Date() }, user.id) : null;
  const savedProfile: SavedBirth | null = portrait?.birthDate ? { date: toIsoDate(portrait.birthDate), time: portrait.time, place: portrait.place } : null;

  return (
    <main>
      <header className="natal-intro">
        <h1>{NATAL_TITLE}</h1>
        <p>{NATAL_INTRO}</p>
      </header>
      {/* Спрайт глифов один на страницу: колесо, таблица и сводка ссылаются на него через <use> */}
      <NatalSprite />
      <NatalCalculator signedIn={Boolean(user)} savedProfile={savedProfile} />
      <p className="natal-disclaimer">{DISCLAIMER}</p>
    </main>
  );
}
