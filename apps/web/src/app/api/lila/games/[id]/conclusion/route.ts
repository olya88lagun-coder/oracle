import { NextResponse, type NextRequest } from "next/server";
import { lilaDeps, lilaUser } from "@/server/lila-route";
import { conclusionStatus } from "@/server/lila-service";

// Страница «Готовим итог» спрашивает раз в несколько секунд; ответ — только владельцу платной завершённой партии
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await lilaUser(request);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const status = await conclusionStatus(lilaDeps(), { userId: user.id, gameId: (await params).id });
  if (!status) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404, headers: { "cache-control": "no-store" } });
  return NextResponse.json({ ok: true, status }, { headers: { "cache-control": "no-store" } });
}
