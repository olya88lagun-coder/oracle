import type { TimelineItem } from "@/lib/lunar-calendar";

// «События месяца»: главные фазы и переходы Луны в другой знак по порядку, с временем по Москве. Только факты, без оценок дней.
export function MoonMonthEvents({ items }: { items: readonly TimelineItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="moon-events" aria-labelledby="moon-events-title">
      <h2 id="moon-events-title">События месяца</h2>
      <p className="moon-events__note">Время по Москве. Фазы и переходы Луны в другой знак зодиака по расчёту.</p>
      <ol className="moon-events__list">
        {items.map((item) => (
          <li key={`${item.kind}-${item.at}`} className={`moon-events__item moon-events__item--${item.kind === "sign" ? "sign" : "phase"}`} data-kind={item.kind}>
            <time dateTime={item.date}>{item.label}</time>
            <span>{item.title}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
