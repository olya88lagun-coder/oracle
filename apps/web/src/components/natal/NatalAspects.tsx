import type { NatalChart } from "@oracle/core/natal";
import { ASPECTS_TITLE, NOTE_NO_MOON_ASPECTS, aspectLine } from "@/lib/natal-copy";

// Аспекты в порядке расчёта (от самых точных). Пустой список — только заголовок. Без времени Луну в аспекты не берут: об этом строка под списком
export function NatalAspects({ chart }: { chart: NatalChart }) {
  return (
    <div className="natal-aspects-section">
      <h3>{ASPECTS_TITLE}</h3>
      {chart.aspects.length > 0 && (
        <>
          <ul className="natal-aspects">
            {chart.aspects.map((aspect) => (
              <li key={`${aspect.a}-${aspect.b}-${aspect.aspect}`} className="natal-aspects__item" data-aspect={aspect.aspect}>
                <span className="natal-aspects__mark" aria-hidden="true" />
                <span>{aspectLine(aspect)}</span>
              </li>
            ))}
          </ul>
          {!chart.timeKnown && <p className="natal-aspects__note">{NOTE_NO_MOON_ASPECTS}</p>}
        </>
      )}
    </div>
  );
}
