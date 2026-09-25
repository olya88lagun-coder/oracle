"use client";

import Link from "next/link";
import { useState } from "react";

export function LoginPanel() {
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Согласие фиксируется на сервере до перехода в VK ID: VK не возвращает наши параметры обратно
  async function signIn() {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/consent", { method: "POST" });
      if (!response.ok) throw new Error(`consent ${response.status}`);
      window.location.assign("/api/auth/vk/start");
    } catch {
      setError("Не получилось сохранить согласие. Проверьте интернет и попробуйте ещё раз.");
      setSending(false);
    }
  }

  return (
    <div className="stack">
      <label className="choice">
        <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
        <span>
          Соглашаюсь на <Link href="/consent">обработку персональных данных</Link> в соответствии с <Link href="/privacy">политикой</Link>
        </span>
      </label>
      <button type="button" className="button button--block" disabled={!agreed || sending} onClick={signIn}>
        {sending ? "Переходим в VK ID…" : "Войти через VK ID"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
