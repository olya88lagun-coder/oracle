"use client";

import { LILA_SESSION_PRODUCT } from "@oracle/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import { purchaseErrorMessage } from "@/lib/report-offer";

type Status = "pending" | "canceled" | "blocked";
type Props = { purchaseId: string; initial: Status };

const POLL_MS = 3000;

const TEXT: Record<Status, { title: string; body: string }> = {
  pending: { title: "Ждём подтверждения оплаты", body: "Обычно это несколько секунд. Страницу можно не обновлять." },
  canceled: { title: "Оплата не прошла", body: "Деньги не списаны. Можно попробовать ещё раз." },
  blocked: { title: "Оплата прошла, но в портрете идёт другая партия", body: "Завершите её — и партия с проводником начнётся сама." },
};

function RetryButton({ purchaseId }: { purchaseId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function retry() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ retry: purchaseId, product: LILA_SESSION_PRODUCT }),
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (body.ok && body.url) return window.location.assign(body.url);
      setError(purchaseErrorMessage(body.error));
    } catch {
      setError(purchaseErrorMessage(null));
    }
    setBusy(false);
  }
  return (
    <>
      <button type="button" className="button button--lavender button--block" onClick={() => void retry()} disabled={busy}>
        Попробовать снова
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

export function LilaPaymentWaiting({ purchaseId, initial }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initial);

  useEffect(() => {
    if (status === "canceled") return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/purchases/${purchaseId}`, { cache: "no-store" });
        const body = (await response.json()) as { ok?: boolean; status?: string };
        if (!body.ok) return;
        if (body.status === "ready") {
          reachGoal("lila_paid");
          router.replace(LILA_GAME_PATH);
        } else if (body.status === "pending" || body.status === "canceled" || body.status === "blocked") setStatus(body.status);
      } catch {
        // Сеть мигнула — спросим на следующем круге
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [purchaseId, status, router]);

  const text = TEXT[status];
  return (
    <section className="card stack report-waiting">
      <p className="eyebrow">Лила с проводником</p>
      <h1 className="report-waiting__title">{text.title}</h1>
      <p role={status === "canceled" ? "alert" : "status"} className={status === "canceled" ? "error" : "lead"}>
        {text.body}
      </p>
      {status === "canceled" && <RetryButton purchaseId={purchaseId} />}
      {status === "blocked" && (
        <Link className="button button--lavender" href={LILA_GAME_PATH}>
          Продолжить партию
        </Link>
      )}
    </section>
  );
}
