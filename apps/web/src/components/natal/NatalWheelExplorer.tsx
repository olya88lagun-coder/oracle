"use client";

import type { NatalChart } from "@oracle/core/natal";
import Link from "next/link";
import { useReducer } from "react";
import { ANGLE_AXIS_LABELS, ANGLE_NAMES, BODY_NAMES } from "@/lib/natal-copy";
import type { NatalKeyRegistry } from "@/lib/natal-texts";
import {
  WHEEL_CARD_HINT,
  WHEEL_CARD_LABEL,
  WHEEL_PICKER_LABEL,
  describeSelection,
  initialWheelState,
  selectionKey,
  shownSelection,
  wheelReducer,
  type WheelCard,
  type WheelSelection,
} from "@/lib/natal-wheel-card";
import { NatalGlyph, bodyGlyphId } from "./NatalGlyph";
import { NatalWheel, type NatalBirth } from "./NatalWheel";

// Колесо с пояснением: на колесо можно навести мышь или нажать (планета, знак, дом, ось), то же доступно кнопками — их ряд идёт
// после карточки, чтобы на телефоне пояснение оказывалось сразу под колесом. Колесо для программ экрана остаётся картинкой с описанием,
// а кнопки и карточка работают с клавиатуры.
// Выбор живёт только в этом компоненте: ни в адрес, ни в хранилище, ни на сервер он не попадает.

type PickerItem = { selection: WheelSelection; label: string; glyph: string | null; axis: string | null };

function pickerItems(chart: NatalChart): PickerItem[] {
  const items: PickerItem[] = chart.points.map((point) => ({ selection: { kind: "body", id: point.id }, label: BODY_NAMES[point.id], glyph: bodyGlyphId(point.id), axis: null }));
  if (chart.timeKnown && chart.ascendant) items.push({ selection: { kind: "angle", id: "ascendant" }, label: ANGLE_NAMES.ascendant, glyph: null, axis: ANGLE_AXIS_LABELS.ascendant });
  if (chart.timeKnown && chart.midheaven) items.push({ selection: { kind: "angle", id: "midheaven" }, label: ANGLE_NAMES.midheaven, glyph: null, axis: ANGLE_AXIS_LABELS.midheaven });
  return items;
}

function CardBody({ card }: { card: WheelCard }) {
  return (
    <>
      <p className="natal-wheel-card__title">{card.title}</p>
      <dl className="natal-wheel-card__rows">
        {card.rows.map((row) => (
          <div key={row.label} className="natal-wheel-card__row">
            <dt>{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>
      {card.note && <p className="natal-wheel-card__note">{card.note}</p>}
      {card.link && (
        <Link className="natal-wheel-card__link" href={card.link.href} prefetch={false}>
          {card.link.label}
        </Link>
      )}
    </>
  );
}

type Props = { chart: NatalChart; birth: NatalBirth; keyTexts?: NatalKeyRegistry; initialSelection?: WheelSelection };

export function NatalWheelExplorer({ chart, birth, keyTexts, initialSelection }: Props) {
  const [state, dispatch] = useReducer(wheelReducer, initialSelection ? { pinned: initialSelection, hover: null } : initialWheelState);
  const selection = shownSelection(state);
  const card = selection ? describeSelection(chart, selection, keyTexts) : null;
  const pinnedKey = state.pinned ? selectionKey(state.pinned) : null;

  return (
    <div className="natal-wheel-explorer" onKeyDown={(event) => event.key === "Escape" && dispatch({ type: "clear" })}>
      <NatalWheel
        chart={chart}
        birth={birth}
        interaction={{ selection, onHover: (target) => dispatch({ type: "hover", target }), onTap: (target) => dispatch({ type: "tap", target }) }}
      />
      <div className="natal-wheel-card" role="group" aria-live="polite" aria-label={WHEEL_CARD_LABEL}>
        {card ? <CardBody card={card} /> : <p className="natal-wheel-card__hint">{WHEEL_CARD_HINT}</p>}
      </div>
      <div className="natal-wheel-picker" role="group" aria-label={WHEEL_PICKER_LABEL}>
        {pickerItems(chart).map((item) => (
          <button key={selectionKey(item.selection)} type="button" className="natal-wheel-picker__item" aria-pressed={pinnedKey === selectionKey(item.selection)} onClick={() => dispatch({ type: "tap", target: item.selection })}>
            {item.glyph && <NatalGlyph id={item.glyph} variant="table" />}
            {item.axis && (
              <span className="natal-summary__axis" aria-hidden="true">
                {item.axis}
              </span>
            )}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
