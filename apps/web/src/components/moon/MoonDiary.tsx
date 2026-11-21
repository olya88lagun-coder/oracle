"use client";

import { useState, type FormEvent } from "react";
import { DIARY_MAX_LENGTH } from "@/lib/moon-diary";

// «Лунный дневник» выбранного дня: одна короткая запись в ответ на вопрос дня. Запись хранится только в этом браузере.
// Родитель даёт `key` по дате: при смене дня поле создаётся заново с записью нового дня. Несохранённый текст сохраняется, когда поле теряет фокус
export function MoonDiary({ prompt, note, canWrite, onSave, stats }: { prompt: string; note: string; canWrite: boolean; onSave: (text: string) => void; stats: { inMonth: number; streak: number } }) {
  const [text, setText] = useState(note);
  const [saved, setSaved] = useState(false);

  const save = (value: string) => {
    if (value.trim() === note.trim()) return;
    onSave(value);
    setSaved(true);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save(text);
  };

  if (!canWrite) {
    return (
      <div className="moon-diary" data-state="closed">
        <p className="moon-diary__prompt">{prompt}</p>
        <p className="moon-diary__note">Запись откроется в этот день.</p>
      </div>
    );
  }
  return (
    <form className="moon-diary" onSubmit={submit}>
      <label className="moon-diary__prompt" htmlFor="moon-diary-text">{prompt}</label>
      <textarea id="moon-diary-text" className="input moon-diary__text" rows={2} maxLength={DIARY_MAX_LENGTH} value={text} placeholder="Одна строка о том, что вы заметили" onChange={(event) => { setText(event.target.value); setSaved(false); }} onBlur={() => save(text)} />
      <div className="moon-diary__row">
        <button type="submit" className="button button--ghost">Записать</button>
        <span className="moon-diary__count" aria-hidden="true">{text.length} / {DIARY_MAX_LENGTH}</span>
      </div>
      <p className="moon-diary__note" role="status">
        {saved ? "Записано. Запись хранится только в этом браузере." : "Запись хранится только в этом браузере, на сайт не отправляется."}
      </p>
      {stats.inMonth > 0 && <p className="moon-diary__stats">Записей в этом месяце: {stats.inMonth}{stats.streak > 1 ? ` · дней подряд: ${stats.streak}` : ""}</p>}
    </form>
  );
}
