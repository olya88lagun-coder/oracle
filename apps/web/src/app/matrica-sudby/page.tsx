import { toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import { ArcanaIndex } from "@/components/ArcanaIndex";
import { MatrixCalculator } from "@/components/matrix/MatrixCalculator";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { publicMetadata } from "@/lib/seo";
import { getDb } from "@/server/db";
import { loadPortrait } from "@/server/profile-service";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = publicMetadata({
  title: "Матрица судьбы по дате рождения — расчёт онлайн",
  description:
    "Рассчитайте матрицу судьбы по дате рождения: все 22 аркана на диаграмме и трактовка трёх ключевых точек — личности, центра и задачи. Бесплатно, без регистрации.",
  path: MATRIX_PATH,
});

export default async function MatrixPage() {
  const user = await currentUser();
  const portrait = user ? await loadPortrait({ db: getDb(), now: () => new Date() }, user.id) : null;
  const profileDate = portrait?.birthDate ? toIsoDate(portrait.birthDate) : null;

  return (
    <main className="page page--wide stack matrix-page">
      <MatrixCalculator
        signedIn={Boolean(user)}
        profileDate={profileDate}
        intro={
          <div className="stack">
            <p className="eyebrow eyebrow--line">Практика · матрица судьбы</p>
            <h1 className="display">Матрица судьбы по дате рождения</h1>
            <p className="lead">
              22 аркана вашей даты: на что вы опираетесь, как вас видят и какую задачу стоит заметить. Без предсказаний — как зеркало для
              размышления.
            </p>
          </div>
        }
      />

      <section className="stack matrix-about" aria-labelledby="matrix-about">
        <h2 id="matrix-about">Что такое матрица судьбы</h2>
        <p>
          Матрица судьбы раскладывает дату рождения на 22 аркана — те же образы, что у старших арканов Таро. Каждое число занимает своё
          место на диаграмме: одни точки говорят о характере, другие — об опоре, третьи — о задачах и отношениях.
        </p>
        <p>
          Мы не используем матрицу для предсказаний. Это способ посмотреть на себя через символы и задать себе хорошие вопросы: где ваши
          силы, что повторяется, куда хочется расти. Трактовки — гипотезы для размышления, а не диагноз и не приговор.
        </p>
      </section>

      <ArcanaIndex />
    </main>
  );
}
