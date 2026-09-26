"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { reachGoal } from "@/lib/analytics";

const ERRORS: Record<string, string> = {
  invalid_date: "Проверьте дату: она должна быть настоящей и не позже сегодняшней.",
  unauthorized: "Сессия закончилась — войдите снова.",
  rate_limited: "Слишком много попыток подряд. Подождите минуту.",
};

export function BirthDateForm({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile/birth-date", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ birthDate: value }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ kind: "error", text: ERRORS[body.error ?? ""] ?? "Не получилось сохранить. Попробуйте ещё раз." });
        return;
      }
      reachGoal("birth_date_saved");
      setMessage({ kind: "success", text: "Сохранено." });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Не получилось сохранить. Проверьте интернет и попробуйте ещё раз." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <div className="field">
        <label htmlFor="birth-date">Дата рождения</label>
        <input id="birth-date" className="input" type="date" required min="1900-01-01" value={value} onChange={(event) => setValue(event.target.value)} />
      </div>
      <button type="submit" className="button button--lavender" disabled={!value || sending}>
        {sending ? "Сохраняем…" : "Сохранить"}
      </button>
      {message && (
        <p className={message.kind} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
    </form>
  );
}
