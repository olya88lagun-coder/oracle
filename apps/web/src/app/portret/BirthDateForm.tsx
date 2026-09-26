"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { reachGoal } from "@/lib/analytics";

const ERRORS: Record<string, string> = {
  invalid_date: "Проверьте дату: она должна быть настоящей и не позже сегодняшней.",
  unauthorized: "Сессия закончилась — войдите снова.",
  rate_limited: "Слишком много попыток подряд. Подождите минуту.",
};

// Кнопка «Сохранить» видна, только пока в поле есть несохранённая дата; после сохранения на её месте — отметка «Сохранено.»,
// чтобы не нажимать одно и то же много раз. Отметка живёт в постоянной области role="status" — скринридер её объявит
export function BirthDateForm({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSaved = saved !== "" && value === saved;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/birth-date", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ birthDate: value }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(ERRORS[body.error ?? ""] ?? "Не получилось сохранить. Попробуйте ещё раз.");
        return;
      }
      reachGoal("birth_date_saved");
      setSaved(value);
      router.refresh();
    } catch {
      setError("Не получилось сохранить. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  }

  function change(next: string) {
    setValue(next);
    setError(null);
  }

  return (
    <form className="stack" onSubmit={save}>
      <div className="field">
        <label htmlFor="birth-date">Дата рождения</label>
        <input id="birth-date" className="input" type="date" required min="1900-01-01" value={value} onChange={(event) => change(event.target.value)} />
      </div>
      {!isSaved && (
        <button type="submit" className="button button--lavender" disabled={!value || sending}>
          {sending ? "Сохраняем…" : "Сохранить"}
        </button>
      )}
      <p className="saved-note" role="status">
        {isSaved && (
          <>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12.5 2.7 2.7L16 9.8" />
            </svg>
            Сохранено.
          </>
        )}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
