"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { purchaseErrorMessage, reportPath } from "@/lib/report-offer";
import { ReportGoals } from "./ReportGoals";

type Status = "pending" | "generating" | "canceled";
type Props = { purchaseId: string; initial: Status; center: { number: number; image: string } };

const POLL_MS = 3000;

const TEXT: Record<Status, { title: string; body: string }> = {
  pending: { title: "Ждём подтверждения оплаты", body: "Обычно это несколько секунд. Страницу можно не обновлять." },
  generating: {
    title: "Готовим разбор",
    body: "Обычно 1–2 минуты. Мы связываем тексты ваших арканов в семь глав. Можно уйти — разбор будет в «Моём портрете».",
  },
  canceled: { title: "Оплата не прошла", body: "Деньги не списаны. Можно попробовать ещё раз." },
};

function RetryButton({ purchaseId }: { purchaseId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function retry() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ retry: purchaseId }) });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string; purchaseId?: string };
      if (body.ok && body.url) return window.location.assign(body.url);
      if (body.error === "already_paid" && body.purchaseId) return window.location.assign(reportPath(body.purchaseId));
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
      <p>
        <Link href={MATRIX_PATH}>Вернуться к матрице</Link>
      </p>
    </>
  );
}

export function ReportWaiting({ purchaseId, initial, center }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initial);

  useEffect(() => {
    if (status === "canceled") return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/purchases/${purchaseId}`, { cache: "no-store" });
        const body = (await response.json()) as { ok?: boolean; status?: string };
        if (!body.ok) return;
        if (body.status === "ready") router.refresh();
        else if (body.status === "pending" || body.status === "generating" || body.status === "canceled") setStatus(body.status);
      } catch {
        // Сеть мигнула — спросим на следующем круге
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [purchaseId, status, router]);

  const text = TEXT[status];
  return (
    <section className="card stack report-waiting">
      <ReportGoals purchaseId={purchaseId} paid={status === "generating"} />
      <p className="eyebrow">Разбор матрицы судьбы</p>
      <h1 className="report-waiting__title">{text.title}</h1>
      <p role={status === "canceled" ? "alert" : "status"} className={status === "canceled" ? "error" : "lead"}>
        {text.body}
      </p>
      {status === "generating" ? (
        <Image className="report-waiting__art" src={center.image} alt="" width={480} height={480} sizes="(min-width: 760px) 640px, 100vw" unoptimized />
      ) : (
        <div className="report-waiting__orbit" aria-hidden="true">
          <span>{center.number}</span>
        </div>
      )}
      {status === "canceled" && <RetryButton purchaseId={purchaseId} />}
    </section>
  );
}
