"use client";

import { formatBirthDateRu, type LifeThread } from "@oracle/core";
import { useMemo, useState } from "react";
import { PosterButton } from "@/components/PosterButton";
import { PERIOD_POSITIONS, type ThreadCard, type ThreadTexts } from "@/lib/life-thread";
import { YEAR_NAMES } from "@/lib/life-thread-curve";
import { reachNumerologyGoal } from "@/lib/numerology";
import { threadPosterSpec } from "@/lib/poster-thread";
import { ThreadChart } from "./ThreadChart";
import { ThreadReportOffer } from "./ThreadReportOffer";

// offer — только когда продажа включена (флаг, шлюз, принятая партия 10); без него результат прежний. iso — дата, для которой считается разбор
export type ThreadOffer = { signedIn: boolean; owner: boolean };

const ROMAN = ["I", "II", "III", "IV"] as const;
const digitSum = (n: number): number => String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);

function chain(sum: number): number[] {
  const steps = [sum];
  while ((steps.at(-1) ?? 0) > 9) steps.push(digitSum(steps.at(-1) ?? 0));
  return steps;
}

const endDateRu = (iso: string): string => {
  const [year = 0, month = 0, day = 0] = iso.split("-").map(Number);
  return formatBirthDateRu({ year, month, day });
};

function CardSections({ card }: { card: ThreadCard }) {
  return <>{card.sections.map((section) => <div key={section.title} className="stack">
    <h3>{section.title}</h3>
    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
  </div>)}</>;
}

export function ThreadResult({ thread: actual, texts, iso, offer }: { thread: LifeThread; texts: ThreadTexts; iso?: string; offer?: ThreadOffer }) {
  // Год просмотра: по умолчанию текущий; выбор меняет только то, на какой год смотрит страница (график, карточка, формула), расчёт остаётся в браузере
  const [focus, setFocus] = useState(actual.currentYear);
  const thread = useMemo(() => ({ ...actual, currentYear: focus }), [actual, focus]);
  const other = focus !== actual.currentYear;
  const current = thread.years.find((item) => item.year === thread.currentYear) ?? thread.years[0];
  const yearCard = current ? texts.years[current.value] : undefined;
  const digits = current ? `${thread.birth.day}${String(thread.birth.month).padStart(2, "0")}${thread.currentYear}`.split("") : [];
  const sum = digits.reduce((total, digit) => total + Number(digit), 0);
  const steps = chain(sum);
  return <section className="thread-result" aria-labelledby="thread-result-title">
    <div className="thread-now stack">
      <p className="eyebrow">Ваша нить</p>
      <h2 id="thread-result-title" tabIndex={-1}>{other ? `Личный год ${focus}` : "Где вы сейчас"}</h2>
      <div className="field thread-focus">
        <label htmlFor="thread-focus-year">Посмотреть другой год</label>
        <select id="thread-focus-year" className="input" value={focus} onChange={(event) => setFocus(Number(event.target.value))}>
          {actual.years.map((item) => <option key={item.year} value={item.year}>{`${item.year} · год ${item.value} · ${YEAR_NAMES[item.value]}${item.year === actual.currentYear ? " · сейчас" : ""}`}</option>)}
        </select>
        {other && <button type="button" className="button button--ghost" onClick={() => setFocus(actual.currentYear)}>Вернуться к текущему году</button>}
        <p role="status" className="muted">{other ? `Показан ${focus} год: личный год ${current?.value ?? ""}.` : ""}</p>
      </div>
      {current && <p className="thread-now__year"><strong>{`Год ${current.value}`}</strong> · {YEAR_NAMES[current.value]} <span className="muted">{`· с ${endDateRu(current.start)} до ${endDateRu(current.end)}`}</span></p>}
      {yearCard ? <div className="thread-card stack"><CardSections card={yearCard} /></div> : <p className="muted">Описание появится позже.</p>}
    </div>

    <ThreadChart thread={thread} markLabel={other ? (year, value) => `${year} · год ${value}` : undefined} />
    <div className="thread-actions" onClickCapture={() => { reachNumerologyGoal("thread_poster"); }}><PosterButton spec={threadPosterSpec(actual)} /></div>

    <div className="thread-periods stack">
      <p className="eyebrow">Четыре периода</p>
      <h2>Большие отрезки жизни</h2>
      <p className="muted">Границы считаются по дате рождения. Каждый период со своей темой, а на стыках жизнь нередко разворачивается.</p>
      <ol className="thread-periods__list">
        {thread.periods.map((period) => {
          const card = texts.periods[period.value];
          const first = card?.sections[0]?.paragraphs[0];
          return <li key={period.index} className="thread-period stack">
            <h3>{`${ROMAN[period.index - 1]} период · ${PERIOD_POSITIONS[period.index]}`}</h3>
            <p className="muted">{period.toYear === null ? `с ${period.fromYear}` : `${period.fromYear}–${period.toYear}`} · {`число ${period.value}`}</p>
            {card && first ? <>
              <p>{first}</p>
              <details className="thread-period__more"><summary>Читать полностью</summary><CardSections card={card} /></details>
            </> : <p className="muted">Описание появится позже.</p>}
          </li>;
        })}
      </ol>
    </div>

    {offer && iso && <ThreadReportOffer iso={iso} signedIn={offer.signedIn} owner={offer.owner} />}

    {current && <div className="thread-formula stack">
      <h3>Открытая формула</h3>
      <p>Цифры дня и месяца рождения плюс цифры года, сумма сворачивается до 1–9. Для вашей даты и года {thread.currentYear}:</p>
      <p className="year-calculation muted"><span>{digits.join(" + ")} = {sum}{steps.length > 1 && ";"}</span>{steps.length > 1 && <>{" "}<span>{steps.join(" → ")}</span></>}</p>
    </div>}
  </section>;
}
