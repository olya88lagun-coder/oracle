"use client";

import { useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { shareContent } from "@/lib/matrix-save";
import { SITE_URL } from "@/lib/site";

export function ShareButton({ arcanum }: { arcanum: { number: number; name: string; slug: string } }) {
  const [note, setNote] = useState("");

  async function share() {
    reachGoal("matrix_share");
    const content = shareContent(arcanum, SITE_URL);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(content);
        return;
      }
      await navigator.clipboard.writeText(content.url);
      setNote("Ссылка скопирована");
    } catch (error) {
      // Закрытое окно «Поделиться» — не ошибка
      if (error instanceof Error && error.name === "AbortError") return;
      setNote(`Не получилось поделиться — вот ссылка: ${content.url}`);
    }
  }

  return (
    <div className="card stack share-block">
      <h3>Поделиться</h3>
      <p className="muted">Ссылка ведёт на страницу вашего аркана центра. Даты рождения в ней нет.</p>
      <p>
        <button type="button" className="button button--ghost" onClick={share}>
          Поделиться
        </button>
      </p>
      <p className="muted" role="status">
        {note}
      </p>
    </div>
  );
}
