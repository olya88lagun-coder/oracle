import { arcanumByNumber } from "@oracle/content";
import { ReportBook } from "@/components/report/ReportBook";
import { ReportView } from "@/components/report/ReportView";
import { arcanumImage } from "@/lib/arcana-paths";
import { orderedChapters } from "@/lib/report-offer";
import { CHAPTER_TITLES } from "@oracle/core";
import { MATRIX_REPORT_PRICE_KOPECKS } from "@oracle/core";
import { formatRubles } from "@/lib/legal";
import { breadcrumbJsonLd, jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { DEMO_DATE, DEMO_MATRIX, DEMO_REPORT } from "@/server/product-demos";

export const metadata = publicMetadata({ title: "Пример полного разбора матрицы", description: "Полный демонстрационный разбор на вымышленной дате: семь глав, сценарий и эксперимент на неделю. Пример PDF перед покупкой.", path: "/matrica-sudby/primer", image: SITE_PREVIEW_IMAGE });

export default function ReportExamplePage() {
  return <main className="workspace"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([{ name: "Матрица судьбы", path: "/matrica-sudby" }, { name: "Пример разбора", path: "/matrica-sudby/primer" }])) }} /><div className="matrix-wrap">
    <p className="muted">Персональный разбор одной даты — {formatRubles(MATRIX_REPORT_PRICE_KOPECKS)}, разовая оплата. Здесь можно бесплатно оценить формат результата.</p>
    <ReportBook
      cover={{ title: "Пример полного разбора", subtitle: "Демонстрационная дата", image: arcanumImage(arcanumByNumber(DEMO_MATRIX.E), "card") }}
      pages={orderedChapters(DEMO_REPORT).map((chapter) => ({ id: chapter.id, title: CHAPTER_TITLES[chapter.id], paragraphs: chapter.paragraphs, scenario: chapter.scenario as Record<string, string> | null | undefined }))}
    />
    <ReportView demo matrix={DEMO_MATRIX} birthDate={DEMO_DATE} chapters={DEMO_REPORT} />
  </div></main>;
}
