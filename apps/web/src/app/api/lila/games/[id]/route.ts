import { NextResponse, type NextRequest } from "next/server";
import { lilaDeps, lilaResponse, lilaUser } from "@/server/lila-route";
import { gameById } from "@/server/lila-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await lilaUser(request);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return lilaResponse(await gameById(lilaDeps(), { userId: user.id, gameId: (await params).id }));
}
