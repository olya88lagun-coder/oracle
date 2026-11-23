import { calculateMatrix, parseBirthDate } from "@oracle/core";
import { getNatalReport, getPurchase, getReport, getThreadReport } from "@oracle/db";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/server/db";
import { loginDeps } from "@/server/deps";
import { SESSION_COOKIE } from "@/server/http";
import { getCurrentUser } from "@/server/login-service";
import { natalReportChart } from "@/server/natal-report-chart";
import { buildNatalReportPdf } from "@/server/natal-report-pdf";
import { purchaseViewDeps } from "@/server/payments-deps";
import { getPurchaseView } from "@/server/payments-service";
import { pdfAssetsDir } from "@/server/pdf-assets";
import { reportPdfLimiter } from "@/server/rate-limit";
import { buildReportPdf } from "@/server/report-pdf";
import { buildThreadReportPdf } from "@/server/thread-report-pdf";

const FILENAMES = { matrix_report: "razbor-matritsy-sudby.pdf", natal_report: "razbor-natalnoj-karty.pdf", thread_report: "razbor-niti.pdf" } as const;

const notFound = () => NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

async function buildPdf(product: keyof typeof FILENAMES, id: string, birth: string): Promise<Buffer | null> {
  const assetsDir = pdfAssetsDir();
  if (product === "matrix_report") {
    const birthDate = parseBirthDate(birth, new Date());
    const report = birthDate ? await getReport(getDb(), id) : null;
    return birthDate && report ? buildReportPdf({ matrix: calculateMatrix(birthDate), birthDate: birth, chapters: report.chapters, assetsDir }) : null;
  }
  if (product === "natal_report") {
    const report = await getNatalReport(getDb(), id);
    if (!report) return null;
    const purchase = await getPurchase(getDb(), id);
    return buildNatalReportPdf({ chapters: report.chapters, date: birth, placeName: purchase?.natalInput?.placeName ?? null, chartData: natalReportChart(purchase?.natalInput), assetsDir });
  }
  const report = await getThreadReport(getDb(), id);
  return report ? buildThreadReportPdf({ chapters: report.chapters, birthDate: birth, today: report.createdAt, assetsDir }) : null;
}

// PDF собирается из сохранённого разбора при каждом скачивании и отдаётся только владельцу покупки
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(loginDeps(), request.cookies.get(SESSION_COOKIE)?.value ?? null);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!reportPdfLimiter.allow(user.id)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const { id } = await params;
  const view = await getPurchaseView(purchaseViewDeps(), { purchaseId: id, userId: user.id });
  if (!view || view.status !== "ready" || view.duplicateOf) return notFound();
  const product = view.product;
  if (product !== "matrix_report" && product !== "natal_report" && product !== "thread_report") return notFound();

  try {
    const pdf = await buildPdf(product, view.id, view.birthDate);
    if (!pdf) return notFound();
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${FILENAMES[product]}"`,
        "content-length": String(pdf.length),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("report pdf failed", { purchaseId: view.id, error: String(error) });
    return NextResponse.json({ ok: false, error: "pdf_failed" }, { status: 500 });
  }
}
