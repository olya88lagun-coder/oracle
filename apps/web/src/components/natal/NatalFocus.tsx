import type { NatalChart } from "@oracle/core/natal";
import { FOCUS_REPORT_LINE, FOCUS_TITLE, focusItems } from "@/lib/natal-focus";

// «Главная точка карты»: самый тесный аспект и стеллиум, выбранные из самих данных карты (lib/natal-focus.ts).
// Нет ни аспекта, ни скопления планет — блока нет. Строка про платный разбор стоит, только когда блок продажи показан под результатом
export function NatalFocus({ chart, reportShown = false }: { chart: NatalChart; reportShown?: boolean }) {
  const items = focusItems(chart);
  if (items.length === 0) return null;
  return (
    <section className="natal-focus">
      <h3>{FOCUS_TITLE}</h3>
      <div className="natal-focus__items">
        {items.map((item) => (
          <article key={item.kind} className="natal-focus__item" data-kind={item.kind}>
            <p className="natal-focus__eyebrow">{item.eyebrow}</p>
            <h4 className="natal-focus__title">{item.title}</h4>
            {item.meta && <p className="natal-focus__meta">{item.meta}</p>}
            <p className="natal-focus__text">{item.text}</p>
          </article>
        ))}
      </div>
      {reportShown && <p className="natal-focus__more">{FOCUS_REPORT_LINE}</p>}
    </section>
  );
}
