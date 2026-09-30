"use client";

import { useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { COMPAT_SHARE_TEXT, COMPAT_SHARE_URL } from "@/lib/compat";

export function CompatShare() {
  const [copied, setCopied] = useState(false);

  async function share() {
    reachGoal("compat_share");
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Совместимость по дате рождения", text: COMPAT_SHARE_TEXT, url: COMPAT_SHARE_URL });
        return;
      } catch (error) {
        // Человек закрыл окно «Поделиться» — это не ошибка
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${COMPAT_SHARE_TEXT}: ${COMPAT_SHARE_URL}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button type="button" className="button button--ghost" onClick={() => void share()}>
        Отправить партнёру
      </button>
      {copied && <span role="status">Ссылка скопирована.</span>}
    </>
  );
}
