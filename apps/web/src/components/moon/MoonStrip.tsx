import { PHASE_NAMES, type MoonDayCell } from "@/lib/moon-today";
import { MoonDisc } from "./MoonDisc";

// Лента ближайших дней: маленькие диски с настоящими фазами на полдень по Москве
export function MoonStrip({ days }: { days: readonly MoonDayCell[] }) {
  return (
    <section className="moon-strip" aria-labelledby="moon-strip-title">
      <h2 id="moon-strip-title">Ближайшие {days.length} дней</h2>
      <ol className="moon-strip__list">
        {days.map((day) => (
          <li key={day.date} className={`moon-strip__day${day.isToday ? " is-today" : ""}`}>
            <MoonDisc size="mini" illumination={day.snapshot.illumination} waxing={day.snapshot.waxing} phase={day.snapshot.phase} />
            <time dateTime={day.date}>{day.isToday ? "Сегодня" : day.label}</time>
            <span className="moon-strip__phase">{PHASE_NAMES[day.snapshot.phase]}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
