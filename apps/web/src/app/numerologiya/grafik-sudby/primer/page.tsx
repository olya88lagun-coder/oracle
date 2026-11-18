import { calculateLifeThread } from "@oracle/core";
import { buildThreadReport } from "@oracle/content/thread-report";
import { numerologyText } from "@oracle/content/numerology";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ThreadReportView } from "@/components/report/ThreadReportView";
import { THREAD_PATH } from "@/lib/life-thread";
import { NUMEROLOGY_PATH } from "@/lib/numerology";
import { threadReportReady } from "@/lib/numerology-pages";
import { breadcrumbJsonLd, jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { DEMO_THREAD_BIRTH, DEMO_TODAY } from "@/lib/thread-demo";

const PATH = `${THREAD_PATH}/primer`;

export const metadata = publicMetadata({
  title: "Пример разбора нити",
  description: "Демонстрационный разбор нити на вымышленной дате рождения: шесть глав о нынешнем годе, месяцах, ритме, прошлом и трёх правилах. Так выглядит разбор до покупки.",
  path: PATH,
  image: SITE_PREVIEW_IMAGE,
});

export default function ThreadReportExamplePage() {
  // Разбор собирается из текстов партии 10: пока она не принята, примера нет
  if (!threadReportReady()) notFound();
  const thread = calculateLifeThread(DEMO_THREAD_BIRTH, DEMO_TODAY);
  if (!thread) notFound();
  const chapters = buildThreadReport(thread, numerologyText);
  return (
    <main className="workspace">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([{ name: "Нумерология", path: NUMEROLOGY_PATH }, { name: "График судьбы", path: THREAD_PATH }, { name: "Пример разбора", path: PATH }])) }} />
      <div className="matrix-wrap stack">
        <p className="eyebrow">Пример на вымышленной дате</p>
        <ThreadReportView chapters={chapters} birthDate={DEMO_THREAD_BIRTH} today={DEMO_TODAY} />
        <p>
          <Link href={THREAD_PATH}>Построить свою нить</Link>
        </p>
      </div>
    </main>
  );
}
