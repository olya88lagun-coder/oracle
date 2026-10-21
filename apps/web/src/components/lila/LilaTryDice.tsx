"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { getRandomRoll } from "@/lib/lila-dice";
import { LILA_GAME_PATH } from "@/lib/lila-paths";
import { Die } from "./Die";

const ROLL_MS = 600;
const ENTRY_ROLL = 6;

export const TRY_DICE_HINT = `Чтобы войти в игру, нужна шестёрка. Бросок ничего не сохраняет: это только проба.`;

export function tryDiceCaption(roll: number | null): string {
  if (roll === null) return TRY_DICE_HINT;
  if (roll === ENTRY_ROLL) return "Выпала шестёрка: фишка входит на поле, и можно начинать с вашего намерения.";
  return `Выпало ${roll}. Чтобы войти в игру, нужна шестёрка, бросайте ещё.`;
}

// Проба первого броска прямо на странице: ничего не сохраняется и никуда не отправляется, настоящая партия — на /lila/igra
export function LilaTryDice() {
  const [roll, setRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [throws, setThrows] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const throwDie = () => {
    if (rolling) return;
    setRolling(true);
    timer.current = setTimeout(() => {
      setRoll(getRandomRoll());
      setThrows((count) => count + 1);
      setRolling(false);
    }, ROLL_MS);
  };

  return (
    <div className="dice-controls">
      <Die value={roll} rolling={rolling} moveKey={throws} rollMs={ROLL_MS} />
      <div className="die-message">
        <button type="button" className="button button--lavender" disabled={rolling} onClick={throwDie}>
          <Icon name="dice-5" size={18} />
          {rolling ? "Бросаем…" : "Бросить кубик"}
        </button>
        <p role="status" className="dice-caption">
          {rolling ? "" : tryDiceCaption(roll)}
        </p>
      </div>
      {roll === ENTRY_ROLL && !rolling && (
        <Link className="button button--ghost" href={LILA_GAME_PATH}>
          Начать партию с намерением
        </Link>
      )}
    </div>
  );
}
