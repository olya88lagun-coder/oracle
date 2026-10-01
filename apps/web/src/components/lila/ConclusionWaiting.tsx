"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const POLL_MS = 3000;
// Итог обычно готов за минуты; если прошло больше, говорим честно, что он задерживается
const SLOW_AFTER_MS = 10 * 60_000;

export function ConclusionWaiting({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - started > SLOW_AFTER_MS) setSlow(true);
      try {
        const response = await fetch(`/api/lila/games/${gameId}/conclusion`, { cache: "no-store" });
        const body = (await response.json()) as { ok?: boolean; status?: string };
        if (body.ok && body.status === "ready") router.refresh();
      } catch {
        // Сеть мигнула — спросим на следующем круге
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [gameId, router]);
  return (
    <section className="conclusion-chapter lila-conclusion-waiting">
      <h2>Итог партии</h2>
      <p role="status">
        Готовим итог. Обычно до нескольких минут — можно уйти, итог будет в «Моём портрете».
      </p>
      {slow && <p className="muted">Итог задерживается. Загляните сюда позже: как только он будет готов, он появится на этой странице.</p>}
    </section>
  );
}
