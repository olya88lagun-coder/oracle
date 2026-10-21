import type { Metadata } from "next";
import Link from "next/link";
import { ArcanaHubGrid, ArcanaHubGuide, arcanaHubJsonLd } from "@/components/matrix/ArcanaHub";
import { CalculatorLink } from "@/components/CalculatorLink";
import { ARCANA_HUB_PATH, MATRIX_PATH } from "@/lib/arcana-paths";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Значения арканов в матрице судьбы — расшифровка 22 арканов",
  description: "Расшифровка всех 22 арканов матрицы судьбы: ключевые слова, суть образа, значение в личности, центре, задаче, отношениях и деньгах. Без предсказаний.",
  path: ARCANA_HUB_PATH,
  image: SITE_PREVIEW_IMAGE,
});

export default function ArcanaHubPage() {
  return (
    <main className="workspace arcana-hub">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(arcanaHubJsonLd()) }} />
      <div className="matrix-wrap stack">
        <nav aria-label="Навигация" className="detail-crumbs">
          <Link className="touch-link" href={MATRIX_PATH}>
            Матрица судьбы
          </Link>{" "}
          › Значения арканов
        </nav>
        <header className="stack">
          <h1 className="display">Значения арканов в матрице судьбы</h1>
          <p className="lead">
            Все 22 аркана с расшифровкой: ключевые слова, суть образа и разделы о личности, центре, задаче, отношениях и деньгах. Выберите аркан или
            узнайте свои по дате рождения. Без предсказаний — как зеркало для размышления.
          </p>
          <p>
            <CalculatorLink className="button button--lavender">Рассчитать свою матрицу</CalculatorLink>
          </p>
        </header>
        <ArcanaHubGrid />
        <ArcanaHubGuide />
      </div>
    </main>
  );
}
