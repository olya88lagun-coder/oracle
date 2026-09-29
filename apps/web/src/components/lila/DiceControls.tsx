"use client";

import { useState } from "react";

type Props = { busy: boolean; onRoll: (customRoll?: number) => void };
const FACES = [1, 2, 3, 4, 5, 6] as const;

export function DiceControls({ busy, onRoll }: Props) {
  const [own, setOwn] = useState(false);
  return (
    <div className="stack lila-dice">
      <div className="row">
        <button type="button" className="button button--lavender" disabled={busy} onClick={() => onRoll()}>
          Бросить кубик
        </button>
        <button type="button" className="button button--ghost" aria-expanded={own} onClick={() => setOwn((value) => !value)}>
          Играю со своим кубиком
        </button>
      </div>
      {own && (
        <div className="row" role="group" aria-label="Что выпало на вашем кубике">
          {FACES.map((value) => (
            <button key={value} type="button" className="chip lila-dice__face" disabled={busy} aria-label={`Выпало ${value}`} onClick={() => onRoll(value)}>
              {value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
