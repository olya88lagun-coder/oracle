"use client";

import { LILA_SESSION_PRODUCT } from "@oracle/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { reachGoalOnce } from "@/lib/analytics";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import { purchaseErrorMessage } from "@/lib/report-offer";

// ready — оплата подтверждена, партия запускается; страница показывается при быстром платеже, когда статус «готово» уже при первом открытии
type Status = "pending" | "canceled" | "blocked" | "ready";
type Props = { purchaseId: string; initial: Status };

const POLL_MS = 3000;

const TEXT: Record<Status, { title: string; body: string }> = {
  pending: { title: "Ждём подтверждения оплаты", body: "Обычно это несколько секунд. Страницу можно не обновлять." },
  canceled: { title: "Оплата не прошла", body: "Деньги не списаны. Можно попробовать ещё раз." },
  blocked: { title: "Оплата прошла, но в портрете идёт другая партия", body: "Завершите её — и партия с проводником начнётся сама." },
  ready: { title: "Оплата прошла", body: "Открываем партию с проводником…" },
};

// Продажа — это подтверждённая оплата, а не запуск партии: считаем её и при «готово», и при «оплачено, но ждёт очереди»; один раз на покупку
const isPaid = (status: string): boolean => status === "ready" || status === "blocked";
const countSale = (purchaseId: string): void => reachGoalOnce("lila_paid", `oracle-lila-paid:${purchaseId}`);

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
    if (isPaid(initial)) countSale(purchaseId);
    if (initial === "ready") router.replace(LILA_GAME_PATH);
  }, [initial, purchaseId, router]);

  useEffect(() => {
    if (status === "canceled" || status === "ready") return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/purchases/${purchaseId}`, { cache: "no-store" });
        const body = (await response.json()) as { ok?: boolean; status?: string };
        if (!body.ok) return;
        if (body.status === "ready") {
          countSale(purchaseId);
          router.replace(LILA_GAME_PATH);
        } else if (body.status === "pending" || body.status === "canceled" || body.status === "blocked") {
          if (isPaid(body.status)) countSale(purchaseId);
          setStatus(body.status);
        }
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
