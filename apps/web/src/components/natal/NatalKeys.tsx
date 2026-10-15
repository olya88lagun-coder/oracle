import type { NatalChart } from "@oracle/core/natal";
import Link from "next/link";
import { KEYS_TITLE, NOTICE_NO_TIME, READ_FULL, TEXT_SOON, sunMoonAscSummary } from "@/lib/natal-copy";
import { NATAL_KEY_TEXTS, keyTextFor, type NatalKeyBody, type NatalKeyRegistry } from "@/lib/natal-texts";

// «Что это значит»: Солнце, Луна и асцендент. Если для положения опубликован текст, показываем начало и ссылку «Читать полностью»,
// иначе — «Подробный текст скоро появится.» (модификатор natal-key--pending, без ссылки). Без времени у асцендента вместо положения —
// пояснение, что нужно время рождения (как в состоянии 8 макета).

function KeyBlock(props: { body: NatalKeyBody; title: string; sign: NatalChart["points"][number]["sign"]; registry: NatalKeyRegistry }) {
  const published = keyTextFor(props.body, props.sign, props.registry);
  const id = `natal-meaning-${props.body}`;
  if (!published) {
    return (
      <article className="natal-key natal-key--pending" id={id}>
        <h4 className="natal-key__title">{props.title}</h4>
        <p>{TEXT_SOON}</p>
      </article>
    );
  }
  return (
    <article className="natal-key" id={id}>
      <h4 className="natal-key__title">{props.title}</h4>
      <p>{published.summary}</p>
      <Link className="natal-key__link" href={published.href}>
        {READ_FULL}
      </Link>
    </article>
  );
}

export function NatalKeys({ chart, registry = NATAL_KEY_TEXTS }: { chart: NatalChart; registry?: NatalKeyRegistry }) {
  const summary = sunMoonAscSummary(chart);
  const sun = chart.points.find((point) => point.id === "sun");
  const moon = chart.points.find((point) => point.id === "moon");
  if (!sun || !moon) return null;

  return (
    <div className="natal-keys">
      <h3>{KEYS_TITLE}</h3>
      <div className="natal-keys__grid">
        <KeyBlock body="sun" title={summary.sun} sign={sun.sign} registry={registry} />
        <KeyBlock body="moon" title={summary.moon} sign={moon.sign} registry={registry} />
        {chart.timeKnown && chart.ascendant ? (
          <KeyBlock body="ascendant" title={summary.ascendant} sign={chart.ascendant.sign} registry={registry} />
        ) : (
          <article className="natal-key natal-key--pending" id="natal-meaning-ascendant">
            <h4 className="natal-key__title">{summary.ascendant}</h4>
            <p>{NOTICE_NO_TIME}</p>
          </article>
        )}
      </div>
    </div>
  );
}
