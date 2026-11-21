"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { diaryStats, readDiary, withNote, writeDiary, type DiaryNotes } from "@/lib/moon-diary";
import { MoonDiary } from "./MoonDiary";

// Вопрос дня под Луной и кнопка «Записать мысль на сегодня». Вопрос виден сразу, кнопка и дневник появляются, когда браузер прочитал запись из localStorage.
// Запись общая с лунным календарём (тот же ключ в moon-diary.ts) и на сервер не уходит
export function MoonDayAsk({ date, question }: { date: string; question: string }) {
  const [notes, setNotes] = useState<DiaryNotes | null>(null);
  const [open, setOpen] = useState(false);
  const panel = useId();

  useEffect(() => {
    setNotes(readDiary());
  }, []);

  const stats = useMemo(() => diaryStats(notes ?? {}, date, date.slice(0, 7)), [notes, date]);
  const save = (text: string) => {
    const next = withNote(notes ?? {}, date, text);
    setNotes(next);
    writeDiary(next);
  };

  return (
    <section className="moon-ask" aria-label="Вопрос дня">
      <p className="moon-ask__question">{question}</p>
      {notes && (
        <>
          <button type="button" className="button" aria-expanded={open} aria-controls={panel} onClick={() => setOpen((value) => !value)}>Записать мысль на сегодня</button>
          <div id={panel} className="moon-ask__panel" hidden={!open}>
            {open && <MoonDiary key={date} promptHidden prompt={question} note={notes[date] ?? ""} canWrite onSave={save} stats={stats} />}
          </div>
        </>
      )}
    </section>
  );
}
