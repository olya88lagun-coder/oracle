import type { NatalChart } from "@oracle/core/natal";
import type { Ref } from "react";
import { ACTION_RECALCULATE, RESULT_TITLE, formatBirthMeta, sunMoonAscSummary } from "@/lib/natal-copy";
import type { NatalKeyRegistry } from "@/lib/natal-texts";
import { NatalAspects } from "./NatalAspects";
import { NatalGlyph } from "./NatalGlyph";
import { NatalKeys } from "./NatalKeys";
import { NatalShareButton } from "./NatalShareButton";
import { NatalTable } from "./NatalTable";
import { NatalWheel, type NatalBirth } from "./NatalWheel";

export const NATAL_RESULT_TITLE_ID = "natal-result-title";

type Props = {
  chart: NatalChart;
  birth: NatalBirth;
  keyTexts?: NatalKeyRegistry; // опубликованные ключевые тексты; по умолчанию реестр из lib/natal-texts.ts
  headingRef?: Ref<HTMLHeadingElement>; // на заголовок переводят фокус после расчёта
  onRecalculate?: () => void;
};

export function NatalResult({ chart, birth, keyTexts, headingRef, onRecalculate }: Props) {
  const summary = sunMoonAscSummary(chart);
  const hasAscendant = chart.timeKnown && chart.ascendant !== null;

  return (
    <section className="natal-result" aria-labelledby={NATAL_RESULT_TITLE_ID}>
      <div className="natal-result__heading">
        <h2 id={NATAL_RESULT_TITLE_ID} ref={headingRef} tabIndex={-1}>
          {RESULT_TITLE}
        </h2>
      </div>
      <p className="natal-result__meta">{formatBirthMeta(birth)}</p>
      <div className="natal-summary">
        <div className="natal-summary__item">
          <NatalGlyph id="sun" />
          <span>{summary.sun}</span>
        </div>
        <div className="natal-summary__item">
          <NatalGlyph id="moon" />
          <span>{summary.moon}</span>
        </div>
        <div className={hasAscendant ? "natal-summary__item" : "natal-summary__item natal-summary__item--muted"}>
          <span className="natal-summary__axis" aria-hidden="true">
            AC
          </span>
          <span>{summary.ascendant}</span>
        </div>
      </div>
      <div className="natal-result__details">
        <NatalWheel chart={chart} birth={birth} />
        <NatalTable chart={chart} />
      </div>
      <NatalAspects chart={chart} />
      <NatalKeys chart={chart} registry={keyTexts} />
      <div className="natal-actions">
        {/* «Сохранить в портрет» (кнопка .natal-button--save) встанет сюда первой, когда пройдёт юридический барьер G3 (план 7, задача 9):
            до тех пор данные рождения никуда не сохраняются, и кнопки на странице нет. */}
        <NatalShareButton />
        <button type="button" className="natal-button" onClick={onRecalculate}>
          {ACTION_RECALCULATE}
        </button>
      </div>
    </section>
  );
}
