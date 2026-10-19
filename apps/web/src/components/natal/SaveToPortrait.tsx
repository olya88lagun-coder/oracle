"use client";

import Link from "next/link";
import { reachGoal } from "@/lib/analytics";
import { loginHref } from "@/lib/next-path";
import {
  ACTION_SAVE,
  SAVE_ERROR,
  SAVE_LOGIN_AND_SAVE,
  SAVE_OPEN_PORTRAIT,
  SAVE_OTHER_DATA_NOTE,
  SAVE_RETRY,
  SAVE_SAVED,
  SAVE_SAVING,
} from "@/lib/natal-copy";
import type { NatalInput } from "@/lib/natal-input";
import { NATAL_PATH } from "@/lib/natal-paths";
import { markNatalSaveIntent, type NatalSaveState } from "@/lib/natal-save";
import { sessionStore } from "@/lib/matrix-save";

type Props = {
  state: NatalSaveState;
  input: NatalInput; // данные, по которым построена карта: их «Войти и сохранить» запомнит на время входа
  replacesOther: boolean; // в портрете сейчас другие данные рождения
  onSave: () => void;
};

// «Сохранить в портрет» в ряду действий результата. Состояние и запрос ведёт NatalCalculator; здесь только разметка.
// Хуки для оформления: .natal-save (обёртка), .natal-save__note (пояснение), .natal-save__status (живая область), .natal-save__error (ошибка)
export function SaveToPortrait({ state, input, replacesOther, onSave }: Props) {
  return (
    <div className="natal-save">
      {state === "offer" && replacesOther && <p className="natal-save__note">{SAVE_OTHER_DATA_NOTE}</p>}
      {state === "guest" && (
        <a
          className="natal-button natal-button--save"
          href={loginHref(NATAL_PATH)}
          onClick={() => {
            reachGoal("natal_save_click");
            markNatalSaveIntent(sessionStore(), input);
          }}
        >
          {SAVE_LOGIN_AND_SAVE}
        </a>
      )}
      {(state === "offer" || state === "error") && (
        <button
          type="button"
          className="natal-button natal-button--save"
          onClick={() => {
            if (state === "offer") reachGoal("natal_save_click"); // повтор после ошибки — та же попытка, второй раз не считается
            onSave();
          }}
        >
          {state === "error" ? SAVE_RETRY : ACTION_SAVE}
        </button>
      )}
      {/* Область статуса есть в разметке всегда: экранные программы озвучивают только изменение уже существующей области */}
      <p className="natal-save__status" role="status">
        {state === "saving" && SAVE_SAVING}
        {state === "saved" && SAVE_SAVED}
      </p>
      {state === "saved" && (
        <Link className="natal-save__link" href="/portret">
          {SAVE_OPEN_PORTRAIT}
        </Link>
      )}
      {state === "error" && (
        <p className="natal-save__error" role="alert">
          {SAVE_ERROR}
        </p>
      )}
    </div>
  );
}
