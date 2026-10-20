import { NatalReportView } from "@/components/report/NatalReportView";
import { NATAL_PATH } from "@/lib/natal-paths";
import { publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { DEMO_NATAL_DATE, DEMO_NATAL_PLACE, DEMO_NATAL_REPORT } from "@/server/product-demos";

export const metadata = publicMetadata({
  title: "Пример разбора натальной карты",
  description: "Демонстрационный разбор на условных данных (Москва, 7 марта 1990, 12:00): девять глав и сценарий с экспериментом на 7 дней. Так выглядит разбор до покупки.",
  path: `${NATAL_PATH}/primer`,
  image: SITE_PREVIEW_IMAGE,
});

export default function NatalReportExamplePage() {
  return (
    <main className="workspace">
      <div className="matrix-wrap">
        <NatalReportView demo chapters={DEMO_NATAL_REPORT} date={DEMO_NATAL_DATE} placeName={DEMO_NATAL_PLACE} />
      </div>
    </main>
  );
}
