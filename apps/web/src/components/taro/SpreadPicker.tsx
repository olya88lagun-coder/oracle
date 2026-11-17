"use client";

import Link from "next/link";
import { useState } from "react";
import { countLabel } from "@/lib/taro-catalog";
import { PICKER_EXAMPLES, pickSpreads, type SpreadPick } from "@/lib/taro-spread-picker";
import { spreadPath } from "@/lib/taro-spreads";

const PREDICTION_NOTE = "Расклады не отвечают «да» или «нет» о будущем и о чувствах другого человека: мы этого не обещаем. Вот расклады, которые помогают взглянуть на ситуацию с вашей стороны.";

// Подбор расклада по вопросу: считается в браузере, вопрос не уходит на сервер и нигде не сохраняется
export function SpreadPicker() {
  const [question, setQuestion] = useState("");
  const [pick, setPick] = useState<SpreadPick | null>(null);

  const choose = (text: string) => setPick(pickSpreads(text));

  return (
    <section className="spread-picker taro-panel" aria-labelledby="spread-picker-title">
      <h2 id="spread-picker-title">Что вас волнует?</h2>
      <form
        className="spread-picker__form"
        onSubmit={(event) => {
          event.preventDefault();
          choose(question);
        }}
      >
        <label className="visually-hidden" htmlFor="spread-picker-question">
          Ваш вопрос
        </label>
        <input id="spread-picker-question" className="spread-picker__input" type="text" value={question} maxLength={200} placeholder="Например: менять ли мне работу?" autoComplete="off" onChange={(event) => setQuestion(event.target.value)} />
        <button type="submit" className="button button--lavender">
          Подобрать расклад
        </button>
      </form>
      <ul className="spread-picker__examples" aria-label="Готовые вопросы">
        {PICKER_EXAMPLES.map((example) => (
          <li key={example}>
            <button
              type="button"
              className="spread-picker__chip"
              onClick={() => {
                setQuestion(example);
                choose(example);
              }}
            >
              {example}
            </button>
          </li>
        ))}
      </ul>
      <p className="muted spread-picker__privacy">Вопрос остаётся в вашем браузере и никуда не отправляется.</p>
      <div className="spread-picker__result" aria-live="polite">
        {pick && (
          <>
            {pick.predictive && <p className="spread-picker__note">{PREDICTION_NOTE}</p>}
            {!pick.matched && !pick.predictive && <p className="spread-picker__note">Подходящей темы не нашлось, начните с универсального расклада.</p>}
            <ul className="spread-picker__picks">
              {pick.spreads.map((spread) => (
                <li key={spread.slug}>
                  <Link className="spread-picker__pick" href={spreadPath(spread)}>
                    <strong>{spread.name}</strong>
                    <span className="eyebrow">{countLabel(spread.positions.length)}</span>
                    <span>{spread.teaser}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
