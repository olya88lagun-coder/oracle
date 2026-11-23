"use client";

import { useEffect, useState } from "react";
import { MAX_DAY_NOTE, readDayNote, writeDayNote } from "@/lib/taro-day";

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

// «Ваша мысль»: запись к карте дня, чтобы вечером вернуться к ней. Остаётся в браузере до конца московских суток
export function DayNote({ card }: { card: string }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [status, setStatus] = useState<"" | "saved" | "cleared" | "failed">("");

  useEffect(() => {
    const stored = readDayNote(storage(), new Date(), card);
    setText(stored);
    setSaved(stored);
  }, [card]);

  function save() {
    const ok = writeDayNote(storage(), new Date(), card, text);
    const next = text.trim().slice(0, MAX_DAY_NOTE);
    if (!ok) return setStatus("failed");
    setText(next);
    setSaved(next);
    setStatus(next ? "saved" : "cleared");
  }

  return (
    <article className="taro-panel stack taro-day-note">
      <h2>Ваша мысль</h2>
      <div className="field">
        <label htmlFor="day-note">Что отозвалось в карте? Запишите, чтобы вернуться вечером (необязательно)</label>
        <textarea id="day-note" className="input" rows={3} maxLength={MAX_DAY_NOTE} value={text} onChange={(event) => { setText(event.target.value); setStatus(""); }} aria-describedby="day-note-hint" />
        <p id="day-note-hint" className="muted">
          Запись хранится только в этом браузере и пропадёт со сменой карты дня. На сервер она не отправляется.
        </p>
      </div>
      <div className="row">
        <button type="button" className="button button--ghost" disabled={text.trim() === saved} onClick={save}>
          Сохранить мысль
        </button>
        <p role="status" className="muted">
          {status === "saved" ? "Мысль сохранена в этом браузере." : status === "cleared" ? "Запись стёрта." : status === "failed" ? "Не удалось сохранить: браузер не даёт хранить записи." : ""}
        </p>
      </div>
    </article>
  );
}
