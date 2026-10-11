"use client";

import { LILA_INTENTION_MAX_CHARS } from "@oracle/core";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { LILA_THEMES } from "@/lib/lila-themes";
import { clearLilaDraft, readLilaDraft, writeLilaDraft } from "@/lib/lila-draft";
import { GuidedOffer } from "./GuidedOffer";

type Props = { busy: boolean; error: string | null; onStart: (intention: string) => void; guided?: { signedIn: boolean; free?: boolean } | null; guest?: boolean };

const MIN_CHARS = 3;
const OWN_THEME = "";

export function IntentionForm({ busy, error, onStart, guided = null, guest = false }: Props) {
  const [text, setText] = useState("");
  const [theme, setTheme] = useState(OWN_THEME);
  const [loaded, setLoaded] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [cleared, setCleared] = useState(false);
  const ready = loaded && text.trim().length >= MIN_CHARS;

  useEffect(() => {
    const draft = readLilaDraft();
    if (draft) { setText(draft.text); setTheme(draft.theme); }
    setLoaded(true);
  }, []);

  function update(text: string, theme: string) {
    setText(text);
    setTheme(theme);
    setCleared(false);
    // Запись синхронная: переход ко входу сразу после ввода не теряет вопрос.
    setStorageAvailable(writeLilaDraft({ text, theme }));
  }

  function clear() {
    clearLilaDraft();
    setText("");
    setTheme(OWN_THEME);
    setCleared(true);
  }

  function pickTheme(value: string) {
    update(value === OWN_THEME ? text : LILA_THEMES[Number(value)]!.intention, value);
  }

  return (
    <div className="intention-column">
      <form
        className="intention-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) onStart(text);
        }}
      >
        <h2 id="intention-title">Какой вопрос вы хотите исследовать?</h2>
        <label htmlFor="intention-theme">Тема вопроса</label>
        <select id="intention-theme" value={theme} disabled={!loaded || busy} onChange={(event) => pickTheme(event.target.value)}>
          <option value={OWN_THEME}>Свой вопрос</option>
          {LILA_THEMES.map((item, index) => (
            <option key={item.label} value={String(index)}>
              {item.label}
            </option>
          ))}
        </select>
        <label htmlFor="intention-text">Ваше намерение</label>
        <textarea
          id="intention-text"
          rows={4}
          maxLength={LILA_INTENTION_MAX_CHARS}
          value={text}
          disabled={!loaded || busy}
          placeholder="Почему мне трудно принять решение о работе?"
          aria-describedby="intention-hint"
          onChange={(event) => {
            update(event.target.value, OWN_THEME);
          }}
        />
        <p id="intention-hint" className="hint">
          <span>Лучше одно личное и конкретное.</span>
          <span>
            {text.length} / {LILA_INTENTION_MAX_CHARS}
          </span>
        </p>
        <p className="hint">
          {storageAvailable ? "Черновик сохраняется только в этом браузере и восстанавливается в течение 24 часов с последнего изменения." : "Хранилище браузера недоступно: черновик сохранится только до закрытия или обновления страницы."}
        </p>
        {text.length > 0 && <button type="button" className="quiet" disabled={busy} onClick={clear}>Очистить черновик</button>}
        {cleared && <p className="hint" role="status">Черновик удалён из этого браузера.</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button button--lavender" disabled={!ready || busy}>
          <Icon name="dice-5" size={18} />
          {guided ? "Играть без проводника" : "Играть"}
        </button>
        {guest && <p className="hint">Партия хранится только в этом браузере.</p>}
      </form>
      {guided && <GuidedOffer intention={text} signedIn={guided.signedIn} free={guided.free} />}
    </div>
  );
}
