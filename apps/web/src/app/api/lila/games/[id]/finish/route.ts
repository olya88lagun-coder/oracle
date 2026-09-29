import type { NextRequest } from "next/server";
import { lilaPost, lilaResponse } from "@/server/lila-route";
import { finishGame } from "@/server/lila-service";

export const POST = (request: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  lilaPost(request, async ({ user, deps }) => lilaResponse(await finishGame(deps, { userId: user.id, gameId: (await params).id })));
