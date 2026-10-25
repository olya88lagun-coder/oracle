"use client";

import type { Arcanum } from "@oracle/content";
import { useEffect, useState } from "react";
import { reachYearGoal } from "@/lib/year-arcana-analytics";
import { SITE_URL } from "@/lib/site";
import { yearShareContent, yearSocialLinks } from "@/lib/year-arcana";
import { shareYearCard } from "@/lib/year-arcana-share";
import { createYearCard, downloadYearCard } from "@/lib/year-arcana-card";

export function YearCardActions({ arcanum }: { arcanum: Arcanum }) {
  const [file, setFile] = useState<File | null>(null);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => {
    let active = true;
    setFile(null);
    setFailed(false);
    setNote("");
    createYearCard(arcanum).then((value) => { if (active) setFile(value); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [arcanum]);

  async function share() {
    const content = yearShareContent(arcanum, SITE_URL);
    const outcome = await shareYearCard(arcanum, SITE_URL, file, navigator);
    if (outcome === "cancelled") return;
    if (outcome === "shared" || outcome === "copied") reachYearGoal("year_arcana_share");
    setNote(outcome === "shared" ? "Отправлено" : outcome === "copied" ? "Текст и ссылка скопированы. Карточку можно сохранить отдельно." : `Скопируйте ссылку: ${content.url}`);
  }

  return <div className="year-card-actions">
    <div className="row">
      <button type="button" className="button button--ghost" disabled={!file} onClick={() => {
        if (!file) return;
        downloadYearCard(file);
        reachYearGoal("year_arcana_save");
        setNote("Карточка PNG подготовлена к сохранению");
      }}>{file ? "Сохранить карточку" : failed ? "PNG недоступен" : "Готовим карточку…"}</button>
      <button type="button" className="button button--ghost" onClick={() => void share()}>Поделиться</button>
    </div>
    <p className="muted">PNG · 1080 × 1350 · без даты рождения</p>
    <div className="row year-social">{yearSocialLinks(arcanum, SITE_URL).map((link) => <a key={link.goal} href={link.href} target="_blank" rel="noopener noreferrer" className="touch-link" onClick={() => reachYearGoal(link.goal)}>{link.label}</a>)}</div>
    <p className="muted">Ссылки отправляют текст и ссылку на расчёт. Для публикации картинки прикрепите сохранённый PNG.</p>
    {failed && <p className="muted">Не удалось создать PNG. Можно отправить текст и ссылку кнопкой «Поделиться».</p>}
    <p role="status" className="muted year-status">{note}</p>
  </div>;
}
