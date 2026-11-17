import type { CSSProperties } from "react";
import { NatalGlyph } from "@/components/natal/NatalGlyph";
import type { RibbonSegment } from "@/lib/lunar-calendar";

// Лента «Луна по знакам»: промежутки знаков пропорционально времени (--from и --to — доли месяца). Это же и текстовый список для скринридеров.
// Глиф знака берётся из спрайта натальной карты (NatalSprite на странице); смысл всегда есть в тексте рядом. Положение отметки «сейчас» — по переменной --today (выставляет MoonTodayMark). Оформление — Codex (docs/design/codex-brief-lunar-calendar.md)
export function MoonSignRibbon({ segments }: { segments: readonly RibbonSegment[] }) {
  return (
    <section className="moon-ribbon" aria-labelledby="moon-ribbon-title">
      <h2 id="moon-ribbon-title">Луна по знакам</h2>
      <ol className="moon-ribbon__list">
        {segments.map((segment) => (
          <li key={segment.from} className="moon-ribbon__seg" style={{ "--from": segment.from.toFixed(4), "--to": segment.to.toFixed(4) } as CSSProperties}>
            <NatalGlyph id={segment.sign} className="moon-ribbon__glyph" />
            <span className="moon-ribbon__sign">{segment.signName}</span>
            <span className="moon-ribbon__time">{segment.label}</span>
          </li>
        ))}
      </ol>
      <span className="moon-ribbon__now" aria-hidden="true" />
    </section>
  );
}
