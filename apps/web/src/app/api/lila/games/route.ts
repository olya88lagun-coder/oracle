import type { NextRequest } from "next/server";
import { lilaPost, lilaResponse } from "@/server/lila-route";
import { startGame } from "@/server/lila-service";

export const POST = (request: NextRequest) => lilaPost(request, async ({ user, body, deps }) => lilaResponse(await startGame(deps, { userId: user.id, intention: body.intention })));
