import type { DayRow } from "@/lib/lunar-calendar";

// Подробности «день за днём»: на телефоне оформление превращает строки в карточки или прокручивает таблицу внутри блока
export function MoonMonthDays({ rows }: { rows: readonly DayRow[] }) {
  return (
    <section className="moon-days" aria-labelledby="moon-days-title">
      <h2 id="moon-days-title">День за днём</h2>
      <div className="moon-days__scroll">
        <table className="moon-days__table">
          <thead>
            <tr>
              <th scope="col">Дата</th>
              <th scope="col">Фаза</th>
              <th scope="col">Лунные сутки</th>
              <th scope="col">Знак Луны</th>
              <th scope="col">Восход и заход</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date} className="moon-days__row" data-date={row.date}>
                <th scope="row">{row.label}</th>
                <td>{row.phaseName} · {row.percent} %</td>
                <td>{row.lunar}</td>
                <td>{row.signName}</td>
                <td>{row.riseSet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
