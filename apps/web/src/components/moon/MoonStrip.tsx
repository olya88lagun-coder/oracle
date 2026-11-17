import { useRef, type KeyboardEvent } from "react";
import type { MoonCalendarDay } from "./MoonExplorer";
import { MoonDisc } from "./MoonDisc";

export function MoonStrip({ days, selected, onSelect }: {
  days: readonly MoonCalendarDay[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const select = (index: number, focus = false) => {
    const button = listRef.current?.querySelectorAll("button")[index];
    const list = listRef.current;
    if (!list || !button) return;
    onSelect(index);
    if (focus) button.focus({ preventScroll: true });
    const bounds = list.getBoundingClientRect();
    const cell = button.getBoundingClientRect();
    if (cell.left < bounds.left) list.scrollLeft += cell.left - bounds.left;
    if (cell.right > bounds.right) list.scrollLeft += cell.right - bounds.right;
  };

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const destinations: Partial<Record<string, number>> = {
      ArrowLeft: Math.max(0, index - 1),
      ArrowRight: Math.min(days.length - 1, index + 1),
      Home: 0,
      End: days.length - 1,
    };
    const next = destinations[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, true);
  }

  return (
    <section className="moon-strip" aria-labelledby="moon-strip-title">
      <div className="moon-strip__head">
        <h2 id="moon-strip-title">Ближайшие {days.length} дней</h2>
        <button className="moon-strip__reset" type="button" aria-label="Вернуться к сегодняшней фазе"
          aria-controls="moon-selected-phase" aria-disabled={selected === 0} onClick={() => select(0)}>Сегодня</button>
      </div>
      <ol ref={listRef} className="moon-strip__list">
        {days.map((day, index) => (
          <li key={day.date} className={`moon-strip__day${day.isToday ? " is-today" : ""}`}>
            <button className="moon-strip__pick" type="button" aria-pressed={index === selected}
              aria-controls="moon-selected-phase" tabIndex={index === selected ? 0 : -1}
              onClick={() => select(index)} onKeyDown={(event) => move(event, index)}>
              <MoonDisc size="mini" illumination={day.illumination} waxing={day.waxing} phase={day.phase} />
              <time dateTime={day.date}>{day.isToday ? "Сегодня" : day.label}</time>
              <span className="moon-strip__phase">{day.phaseName}</span>
            </button>
          </li>
        ))}
      </ol>
      <input className="moon-strip__range" type="range" min={0} max={days.length - 1} value={selected}
        aria-label="Выбрать дату фазы Луны" aria-controls="moon-selected-phase"
        aria-valuetext={selected === 0 ? "Сегодня" : days[selected]?.dateLabel}
        onChange={(event) => select(event.currentTarget.valueAsNumber)} />
    </section>
  );
}
