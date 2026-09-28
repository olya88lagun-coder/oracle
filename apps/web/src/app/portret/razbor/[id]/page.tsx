import { calculateMatrix, parseBirthDate } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import { getReport } from "@oracle/db";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReportView } from "@/components/report/ReportView";
import { arcanumImage } from "@/lib/arcana-paths";
import { reportPath } from "@/lib/report-offer";
import { getDb } from "@/server/db";
import { purchaseViewDeps } from "@/server/payments-deps";
import { getPurchaseView } from "@/server/payments-service";
import { requireUser } from "@/server/viewer";
import { ReportGoals } from "./ReportGoals";
import { ReportWaiting } from "./ReportWaiting";

export const metadata: Metadata = { title: "Разбор матрицы судьбы", robots: { index: false, follow: false } };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const view = await getPurchaseView(purchaseViewDeps(), { purchaseId: id, userId: user.id });
  if (!view) notFound();
  if (view.duplicateOf) redirect(reportPath(view.duplicateOf));
  const birthDate = parseBirthDate(view.birthDate, new Date());
  if (!birthDate) notFound();
  const matrix = calculateMatrix(birthDate);

  const report = view.status === "ready" ? await getReport(getDb(), view.id) : null;
  if (!report) {
    const center = arcanumByNumber(matrix.E);
    const initial = view.status === "ready" ? "generating" : view.status;
    return (
      <main className="page stack">
        <ReportWaiting purchaseId={view.id} initial={initial} center={{ number: center.number, image: arcanumImage(center, "card") }} />
      </main>
    );
  }
  return (
    <main className="page page--wide">
      <ReportGoals purchaseId={view.id} paid opened />
      <ReportView matrix={matrix} birthDate={view.birthDate} chapters={report.chapters} />
    </main>
  );
}
