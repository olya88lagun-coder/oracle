import { toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import { CompatCalculator } from "@/components/compat/CompatCalculator";
import { compatFaqJsonLd, CompatGuide } from "@/components/compat/CompatGuide";
import { COMPAT_PATH } from "@/lib/compat";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { getDb } from "@/server/db";
import { loadPortrait } from "@/server/profile-service";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = publicMetadata({
  title: "Совместимость по дате рождения онлайн бесплатно — расчёт по матрице судьбы",
  description: "Введите две даты рождения и узнайте аркан вашей пары: как ваши матрицы судьбы разговаривают друг с другом. Бесплатно, без регистрации, даты остаются у вас.",
  path: COMPAT_PATH,
  image: SITE_PREVIEW_IMAGE,
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Совместимость по дате рождения",
  url: `${SITE_URL}${COMPAT_PATH}`,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  inLanguage: "ru",
  offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
};

export default async function CompatibilityPage() {
  const user = await currentUser();
  const portrait = user ? await loadPortrait({ db: getDb(), now: () => new Date() }, user.id) : null;
  const profileDate = portrait?.birthDate ? toIsoDate(portrait.birthDate) : null;
  return (
    <main className="page page--wide stack compat-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(compatFaqJsonLd()) }} />
      <div className="stack">
        <p className="eyebrow eyebrow--line">Практика · совместимость</p>
        <h1 className="display">Совместимость по дате рождения</h1>
        <p className="lead">Две даты — один общий аркан: как ваши матрицы судьбы разговаривают друг с другом. Без предсказаний — как повод для разговора.</p>
      </div>
      <CompatCalculator profileDate={profileDate} />
      <CompatGuide />
    </main>
  );
}
