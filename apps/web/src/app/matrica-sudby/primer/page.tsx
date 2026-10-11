import { ReportView } from "@/components/report/ReportView";
import { MATRIX_REPORT_PRICE_KOPECKS } from "@oracle/core";
import { formatRubles } from "@/lib/legal";
import { publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { DEMO_DATE, DEMO_MATRIX, DEMO_REPORT } from "@/server/product-demos";

export const metadata = publicMetadata({ title: "Пример полного разбора матрицы", description: "Полный демонстрационный разбор на вымышленной дате: семь глав, сценарий и эксперимент на неделю. Пример PDF перед покупкой.", path: "/matrica-sudby/primer", image: SITE_PREVIEW_IMAGE });

export default function ReportExamplePage() {
  return <main className="workspace"><div className="matrix-wrap">
    <p className="muted">Персональный разбор одной даты — {formatRubles(MATRIX_REPORT_PRICE_KOPECKS)}, разовая оплата. Здесь можно бесплатно оценить формат результата.</p>
    <ReportView demo matrix={DEMO_MATRIX} birthDate={DEMO_DATE} chapters={DEMO_REPORT} />
  </div></main>;
}
