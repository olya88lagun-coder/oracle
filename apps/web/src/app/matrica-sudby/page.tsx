import { toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import { MatrixCalculator } from "@/components/matrix/MatrixCalculator";
import { matrixFaqJsonLd, MatrixGuide } from "@/components/matrix/MatrixGuide";
import { MatrixCta, MatrixLibrary, MatrixPreview } from "@/components/matrix/MatrixSections";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { jsonLdScript, publicMetadata } from "@/lib/seo";
import { listPaidPurchases } from "@oracle/db";
import { getDb } from "@/server/db";
import { salesEnabled } from "@/server/payments-deps";
import { loadPortrait } from "@/server/profile-service";
import { isOwnerUser } from "@/server/owner";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = publicMetadata({
  title: "Рассчитать матрицу судьбы по дате рождения онлайн бесплатно",
  description:
    "Рассчитайте матрицу судьбы по дате рождения: все 22 аркана на диаграмме и трактовка трёх ключевых точек — личности, центра и задачи. Бесплатно, без регистрации.",
  path: MATRIX_PATH,
  // Каменная сцена первого экрана страницы — та же, что видит посетитель
  image: { url: "/images/matrix/matrix-stone.webp", alt: "Матрица судьбы: каменная плита с золотым узором", width: 1536, height: 1024 },
});

export default async function MatrixPage() {
  const user = await currentUser();
  const portrait = user ? await loadPortrait({ db: getDb(), now: () => new Date() }, user.id) : null;
  const profileDate = portrait?.birthDate ? toIsoDate(portrait.birthDate) : null;
  const paid = user ? (await listPaidPurchases(getDb(), user.id)).map((purchase) => ({ birthDate: purchase.birthDate, purchaseId: purchase.id })) : [];

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
      <MatrixGuide />
      <MatrixLibrary />
      <MatrixCta />
    </main>
  );
}
