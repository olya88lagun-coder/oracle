import { toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import Link from "next/link";
import { MatrixCalculator } from "@/components/matrix/MatrixCalculator";
import { matrixFaqJsonLd, MatrixGuide } from "@/components/matrix/MatrixGuide";
import { MatrixCta, MatrixLibrary, MatrixPreview } from "@/components/matrix/MatrixSections";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { YEAR_PATH } from "@/lib/year-arcana";
import { listPaidPurchases } from "@oracle/db";
import { getDb } from "@/server/db";
import { salesEnabled } from "@/server/payments-deps";
import { loadPortrait } from "@/server/profile-service";
import { isOwnerUser } from "@/server/owner";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = publicMetadata({
  title: "Матрица судьбы: рассчитать онлайн бесплатно с расшифровкой",
  description:
    "Рассчитайте матрицу судьбы по дате рождения онлайн бесплатно: диаграмма из 22 арканов и расшифровка личности, центра и задачи. Без регистрации, расчёт в браузере.",
  path: MATRIX_PATH,
  // Каменная сцена первого экрана страницы — та же, что видит посетитель
  image: { url: "/images/matrix/matrix-stone.webp", alt: "Матрица судьбы: каменная плита с золотым узором", width: 1536, height: 1024 },
});

export default async function MatrixPage() {
  const user = await currentUser();
  const portrait = user ? await loadPortrait({ db: getDb(), now: () => new Date() }, user.id) : null;
  const profileDate = portrait?.birthDate ? toIsoDate(portrait.birthDate) : null;
  const paid = user ? (await listPaidPurchases(getDb(), user.id)).filter((purchase) => purchase.product === "matrix_report").map((purchase) => ({ birthDate: purchase.birthDate, purchaseId: purchase.id })) : [];

  return (
    <main className="matrix-scene">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(matrixFaqJsonLd()) }} />
      <MatrixCalculator
        signedIn={Boolean(user)}
        profileDate={profileDate}
        paidReports={salesEnabled()}
        paid={paid}
        ownerFree={user ? await isOwnerUser(user.id) : false}
        intro={
          <div className="stack matrix-intro">
            <h1 id="matrix-title" className="display">
              Матрица судьбы <span>по дате рождения</span>
            </h1>
            <p className="lead">22 аркана вашей даты: на что вы опираетесь, как вас видят и какую задачу стоит заметить. Без предсказаний — как зеркало для размышления.</p>
          </div>
        }
      />
      <MatrixPreview />
      <section className="matrix-wrap stack" style={{ paddingBlock: 32 }} aria-labelledby="matrix-year-link">
        <h2 id="matrix-year-link">С каким вопросом войти в 2027 год?</h2>
        <p><Link className="touch-link" href={YEAR_PATH}>Мой аркан 2027 года — бесплатный расчёт и карточка</Link></p>
      </section>
      <MatrixGuide />
      <MatrixLibrary />
      <MatrixCta />
    </main>
  );
}
