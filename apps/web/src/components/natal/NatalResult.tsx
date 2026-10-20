import type { NatalChart } from "@oracle/core/natal";
import { useId, type ReactNode } from "react";
import { ACTION_RECALCULATE, RESULT_TITLE, formatBirthMeta, sunMoonAscSummary } from "@/lib/natal-copy";
import type { NatalKeyRegistry } from "@/lib/natal-texts";
import type { QuickVariant } from "@/lib/natal-quick-pages";
import { NatalAnswer } from "./NatalAnswer";
import { NatalAspects } from "./NatalAspects";
import { NatalFocus } from "./NatalFocus";
import { NatalGlyph } from "./NatalGlyph";
import { NatalKeys } from "./NatalKeys";
import { NatalShareButton } from "./NatalShareButton";
import { NatalTable } from "./NatalTable";
import type { NatalBirth } from "./NatalWheel";
import { NatalWheelExplorer } from "./NatalWheelExplorer";

type Props = {
  chart: NatalChart;
  birth: NatalBirth;
  keyTexts?: NatalKeyRegistry; // опубликованные ключевые тексты; по умолчанию реестр из lib/natal-texts.ts
  titleId?: string; // id заголовка h2: на него ссылается обёртка результата; без параметра берётся свой уникальный
  onRecalculate?: () => void;
  answer?: QuickVariant; // страница быстрого расчёта: ответ (асцендент или лунный знак) над картой
  offer?: ReactNode; // блок продажи «Разбор натальной карты»: ведёт NatalCalculator, под ключевыми блоками
  saveAction?: ReactNode; // «Сохранить в портрет» и его состояние: ведёт NatalCalculator, первым в ряду действий
};

export function NatalResult({ chart, birth, keyTexts, titleId, onRecalculate, saveAction, offer, answer }: Props) {
  const ownId = useId();
  const headingId = titleId ?? `${ownId}-title`;
  const summary = sunMoonAscSummary(chart);
  const hasAscendant = chart.timeKnown && chart.ascendant !== null;

  return (
    <section className="natal-result" aria-labelledby={headingId}>
      <div className="natal-result__heading">
        <h2 id={headingId}>
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
      {answer && <NatalAnswer chart={chart} variant={answer} registry={keyTexts} />}
      <div className="natal-result__details">
        <NatalWheelExplorer chart={chart} birth={birth} keyTexts={keyTexts} />
        <NatalTable chart={chart} registry={keyTexts} />
      </div>
      <NatalFocus chart={chart} reportShown={offer !== undefined && chart.timeKnown} />
      <NatalAspects chart={chart} />
      <NatalKeys chart={chart} registry={keyTexts} />
      {offer}
      <div className="natal-actions">
        {saveAction}
        <NatalShareButton />
        <button type="button" className="natal-button" onClick={onRecalculate}>
          {ACTION_RECALCULATE}
        </button>
      </div>
    </section>
  );
}
