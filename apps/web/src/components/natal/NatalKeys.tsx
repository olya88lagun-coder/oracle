import type { NatalChart } from "@oracle/core/natal";
import Link from "next/link";
import { useId } from "react";
import { BODY_NAMES, KEYS_TITLE, MOON_EITHER_TEXT, NOTICE_NO_TIME, READ_FULL, TEXT_SOON, inSign, moonSignRange, sunMoonAscSummary } from "@/lib/natal-copy";
import { NATAL_KEY_TEXTS, keyTextFor, type NatalKeyBody, type NatalKeyRegistry } from "@/lib/natal-texts";

// «Что это значит»: Солнце, Луна и асцендент. Если для положения опубликован текст, показываем начало и ссылку «Читать полностью»,
// иначе — «Подробный текст скоро появится.» (модификатор natal-key--pending, без ссылки). Без времени у асцендента вместо положения —
// пояснение, что нужно время рождения (как в состоянии 8 макета).

function KeyBlock(props: { idPrefix: string; body: NatalKeyBody; title: string; sign: NatalChart["points"][number]["sign"]; registry: NatalKeyRegistry }) {
  const published = keyTextFor(props.body, props.sign, props.registry);
  const id = `${props.idPrefix}-${props.body}`;
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
      <Link className="natal-key__link" href={published.href} prefetch={false}>
        {READ_FULL}
      </Link>
    </article>
  );
}

// Луна в день смены знака без времени рождения: один блок с двумя вариантами вместо единственной безусловной характеристики
function MoonEitherBlock(props: { idPrefix: string; title: string; signs: readonly [NatalChart["points"][number]["sign"], NatalChart["points"][number]["sign"]]; registry: NatalKeyRegistry }) {
  const variants = props.signs.map((sign) => ({ sign, published: keyTextFor("moon", sign, props.registry) }));
  return (
    <article className="natal-key natal-key--either" id={`${props.idPrefix}-moon`}>
      <h4 className="natal-key__title">{props.title}</h4>
      <p>{MOON_EITHER_TEXT}</p>
      <div className="natal-key__variants">
        {variants.map(({ sign, published }) => published ? (
          <p key={sign}>
            <Link className="natal-key__link" href={published.href} prefetch={false}>
              <span>
                {READ_FULL}:{" "}
                <strong className="natal-key__variant-name">{BODY_NAMES.moon} {inSign(sign)}</strong>
              </span>
            </Link>
          </p>
        ) : null)}
      </div>
    </article>
  );
}

// Идентификаторы блоков уникальны у каждого экземпляра (useId): на странице может быть больше одного результата
export function NatalKeys({ chart, registry = NATAL_KEY_TEXTS }: { chart: NatalChart; registry?: NatalKeyRegistry }) {
  const idPrefix = `${useId()}-meaning`;
  const summary = sunMoonAscSummary(chart);
  const moonRange = moonSignRange(chart);
  const sun = chart.points.find((point) => point.id === "sun");
  const moon = chart.points.find((point) => point.id === "moon");
  if (!sun || !moon) return null;

  return (
    <div className="natal-keys">
      <h3>{KEYS_TITLE}</h3>
      <div className="natal-keys__grid">
        <KeyBlock idPrefix={idPrefix} body="sun" title={summary.sun} sign={sun.sign} registry={registry} />
        {moonRange ? <MoonEitherBlock idPrefix={idPrefix} title={summary.moon} signs={moonRange} registry={registry} /> : <KeyBlock idPrefix={idPrefix} body="moon" title={summary.moon} sign={moon.sign} registry={registry} />}
        {chart.timeKnown && chart.ascendant ? (
          <KeyBlock idPrefix={idPrefix} body="ascendant" title={summary.ascendant} sign={chart.ascendant.sign} registry={registry} />
        ) : (
          <article className="natal-key natal-key--pending" id={`${idPrefix}-ascendant`}>
            <h4 className="natal-key__title">{summary.ascendant}</h4>
            <p>{NOTICE_NO_TIME}</p>
          </article>
        )}
      </div>
    </div>
  );
}
