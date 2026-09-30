import { lilaCellByNumber } from "@oracle/content/lila";
import { getLilaConclusion, getLilaGameForUser } from "@oracle/db";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/server/db";
import { lilaUser } from "@/server/lila-route";
import { buildLilaPdf } from "@/server/lila-pdf";
import { pdfAssetsDir } from "@/server/pdf-assets";
import { reportPdfLimiter } from "@/server/rate-limit";

const LILA_PDF_FILENAME = "partiya-lila.pdf";

const notFound = () => NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

// PDF собирается из сохранённого итога при каждом скачивании и отдаётся только владельцу завершённой платной партии
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await lilaUser(request);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!reportPdfLimiter.allow(user.id)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const { id } = await params;
  const game = await getLilaGameForUser(getDb(), id, user.id);
  if (!game || game.mode !== "guided" || game.status !== "finished") return notFound();
  const conclusion = await getLilaConclusion(getDb(), game.id);
  if (!conclusion) return notFound();

  try {
    const pdf = await buildLilaPdf({
      intention: game.intention,
      movesCount: game.movesCount,
      finishedAt: game.finishedAt ?? conclusion.createdAt,
      chapters: conclusion.chapters,
      moves: game.moves.filter((move) => move.landed !== move.from).map((move) => ({ n: move.n, cell: lilaCellByNumber(move.to).name, note: move.note })),
      assetsDir: pdfAssetsDir(),
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${LILA_PDF_FILENAME}"`,
        "content-length": String(pdf.length),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("lila pdf failed", { gameId: game.id, error: String(error) });
    return NextResponse.json({ ok: false, error: "pdf_failed" }, { status: 500 });
  }
}
