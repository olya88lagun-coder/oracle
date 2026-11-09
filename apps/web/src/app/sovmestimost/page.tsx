import { toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArcanaIndex } from "@/components/ArcanaIndex";
import { BLOG_PATH } from "@/lib/blog";
import { CompatCalculator } from "@/components/compat/CompatCalculator";
import { compatFaqJsonLd, CompatCta, CompatGuide, CompatPreview } from "@/components/compat/CompatGuide";
import { COMPAT_PATH, compatArcanumPath } from "@/lib/compat";
import { acceptedPairPaths } from "@/lib/numerology-pages";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { listPaidPurchases } from "@oracle/db";
import { getDb } from "@/server/db";
import { salesEnabled } from "@/server/payments-deps";
import { loadPortrait } from "@/server/profile-service";
import { isOwnerUser } from "@/server/owner";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = publicMetadata({
  title: "Матрица совместимости по дате рождения онлайн",
  description: "Рассчитайте аркан совместимости по дате рождения бесплатно: две даты дают аркан пары и сравнение матриц судьбы. Без регистрации, процентов и вердиктов.",
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
  const paid = user ? (await listPaidPurchases(getDb(), user.id)).filter((purchase) => purchase.product === "matrix_report").map((purchase) => ({ birthDate: purchase.birthDate, purchaseId: purchase.id })) : [];
  return (
    <main className="compat-scene">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(compatFaqJsonLd()) }} />
      <div className="compat-scene__art">
        <Image src="/compat-hero.webp" alt="" fill priority unoptimized sizes="100vw" />
      </div>
      <div className="compat-scene__content page page--wide stack">
        <section className="compat-hero-intro stack" aria-labelledby="compat-title">
          <p className="eyebrow eyebrow--line">Практика · совместимость</p>
          <h1 id="compat-title" className="display">
            Совместимость <br />
            по дате рождения
          </h1>
          <p className="lead">Две даты — один общий аркан: как ваши матрицы судьбы разговаривают друг с другом. Без предсказаний — как повод для разговора.</p>
        </section>
        <CompatCalculator profileDate={profileDate} signedIn={Boolean(user)} paidReports={salesEnabled()} paid={paid} ownerFree={user ? await isOwnerUser(user.id) : false} />
        <p className="compat-help-links">
          <Link className="text-link" href={`${BLOG_PATH}/matritsa-sovmestimosti-rasshifrovka`}>
            Посмотреть пример результата
          </Link>
          {" · "}
          <Link className="text-link" href={`${BLOG_PATH}/kak-schitaetsya-matritsa-sovmestimosti`}>
            Проверить формулу расчёта
          </Link>
          {acceptedPairPaths().length > 0 && <>
            {" · "}
            <Link className="text-link" href={acceptedPairPaths()[0]!}>Совместимость по квадрату Пифагора</Link>
          </>}
        </p>
        <CompatPreview />
        <CompatGuide />
        <ArcanaIndex title="Все 22 аркана совместимости" hub={null} pathOf={compatArcanumPath} />
        <CompatCta />
      </div>
    </main>
  );
}
