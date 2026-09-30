"use client";

import { useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { TARO_SHARE_TEXT, taroShareUrl } from "@/lib/taro-paths";

export function TaroShare({ card }: { card: { slug: string; name: string } }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    reachGoal("taro_share");
    const text = TARO_SHARE_TEXT(card.name);
    const url = taroShareUrl(card);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `Карта дня — ${card.name}`, text, url });
        return;
      } catch (error) {
        // Человек закрыл окно «Поделиться» — это не ошибка
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}: ${url}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button type="button" className="button button--ghost" onClick={() => void share()}>
        Поделиться картой
      </button>
      {copied && <span role="status">Ссылка скопирована.</span>}
    </>
  );
}
