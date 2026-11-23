"use client";

import Link from "next/link";
import { useState } from "react";
import { writeLilaDraft } from "@/lib/lila-draft";
import { LILA_GAME_PATH } from "@/lib/lila-paths";

// Пример намерения с двумя действиями: скопировать или взять в игру. Текст попадает в черновик намерения в браузере
// (lila:draft:v1, как при вводе в форме), в адрес страницы и на сервер он не уходит
export function IntentionExample({ text }: { text: string }) {
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  }

  function take() {
    // Если хранилище недоступно, форма откроется пустой: пример можно вставить из буфера
    writeLilaDraft({ text, theme: "" });
  }

  return (
    <span className="intent-example">
      «{text}»{" "}
      <span className="intent-example__actions">
        <button type="button" className="button button--ghost" aria-label={`Скопировать: ${text}`} onClick={copy}>Скопировать</button>{" "}
        <Link className="button button--ghost" href={LILA_GAME_PATH} aria-label={`Взять в игру: ${text}`} onClick={take}>Взять в игру</Link>
      </span>
      <span role="status" className="muted"> {copied === "ok" ? "Скопировано." : copied === "fail" ? "Не удалось скопировать: выделите текст вручную." : ""}</span>
    </span>
  );
}
