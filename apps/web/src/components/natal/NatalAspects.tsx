import type { NatalChart } from "@oracle/core/natal";
import { ASPECTS_TITLE, NOTE_NO_MOON_ASPECTS, aspectLine } from "@/lib/natal-copy";
import { groupAspects } from "@/lib/natal-spheres";

// Аспекты по группам — опоры, напряжения, слияния; внутри группы порядок расчёта (от самых точных). Пустой список — только заголовок.
// Без времени Луну в аспекты не берут: об этом строка под списками
export function NatalAspects({ chart }: { chart: NatalChart }) {
  return (
    <div className="natal-aspects-section">
      <h3>{ASPECTS_TITLE}</h3>
      {chart.aspects.length > 0 && (
        <>
          {groupAspects(chart.aspects).map(({ group, aspects }) => (
            <div key={group.id} className="natal-aspects-group" data-group={group.id}>
              <h4>{group.title}</h4>
              <p className="natal-aspects-group__lead">{group.lead}</p>
              <ul className="natal-aspects">
                {aspects.map((aspect) => (
                  <li key={`${aspect.a}-${aspect.b}-${aspect.aspect}`} className="natal-aspects__item" data-aspect={aspect.aspect}>
                    <span className="natal-aspects__mark" aria-hidden="true" />
                    <span>{aspectLine(aspect)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!chart.timeKnown && <p className="natal-aspects__note">{NOTE_NO_MOON_ASPECTS}</p>}
        </>
      )}
    </div>
  );
}
