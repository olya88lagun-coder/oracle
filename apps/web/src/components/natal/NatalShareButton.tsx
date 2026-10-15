"use client";

import { useState } from "react";
import { SHARE_COPIED, SHARE_FAILED, SHARE_TEXT, SHARE_TITLE, ACTION_SHARE } from "@/lib/natal-copy";
import { NATAL_PATH } from "@/lib/natal-paths";
import { SITE_URL } from "@/lib/site";

// «Поделиться» отдаёт только адрес страницы калькулятора: ни дат, ни города в ссылке и в тексте нет
export function NatalShareButton() {
  const [note, setNote] = useState("");

  async function share() {
    const url = `${SITE_URL}${NATAL_PATH}`;
    setNote("");
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
        return;
      } catch (error) {
        // Человек закрыл окно «Поделиться» — это не ошибка
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote(SHARE_COPIED);
    } catch {
      setNote(SHARE_FAILED);
    }
  }

  return (
    <>
      <button type="button" className="natal-button" onClick={() => void share()}>
        {ACTION_SHARE}
      </button>
      <p className="natal-actions__note" role="status">
        {note}
      </p>
    </>
  );
}
