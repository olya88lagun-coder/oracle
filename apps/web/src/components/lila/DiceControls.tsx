"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";

type Props = { die: ReactNode; caption: string; canRoll: boolean; busy: boolean; rolling: boolean; onRoll: (customRoll?: number) => void };
const FACES = [1, 2, 3, 4, 5, 6] as const;

// Кубик, кнопка броска и строка статуса — одним рядом; свой кубик раскрывается ниже
export function DiceControls({ die, caption, canRoll, busy, rolling, onRoll }: Props) {
  const [own, setOwn] = useState(false);
  return (
    <div className="dice-controls">
      {die}
      <div className="die-message">
        {canRoll && (
          <button type="button" className="button button--lavender" disabled={busy} onClick={() => onRoll()}>
            <Icon name="dice-5" size={18} />
            {rolling ? "Бросаем…" : "Бросить кубик"}
          </button>
        )}
        <p role="status" className="dice-caption">
          {rolling ? "" : caption}
        </p>
      </div>
      {canRoll && (
        <button type="button" className="quiet own-toggle" aria-expanded={own} onClick={() => setOwn((value) => !value)}>
          Играю со своим кубиком
          <Icon name="chevron-down" />
        </button>
      )}
      {canRoll && own && (
        <div className="own-die" role="group" aria-label="Что выпало на вашем кубике">
          {FACES.map((value) => (
            <button key={value} type="button" disabled={busy} aria-label={`Выпало ${value}`} title={`Выпало ${value}`} onClick={() => onRoll(value)}>
              <Icon name={`dice-${value}` as "dice-1"} size={28} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
