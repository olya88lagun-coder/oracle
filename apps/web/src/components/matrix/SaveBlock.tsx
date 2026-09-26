"use client";

import { formatBirthDateRu, parseBirthDate } from "@oracle/core";
import Link from "next/link";
import { reachGoal } from "@/lib/analytics";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { markSaveIntent, sessionStore, type SaveBlockState } from "@/lib/matrix-save";
import { loginHref } from "@/lib/next-path";

type Props = { state: SaveBlockState; profileDate: string | null; onSave: () => void };

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.7 2.7L16 9.8" />
    </svg>
  );
}

export function SaveBlock({ state, profileDate, onSave }: Props) {
  const other = profileDate ? parseBirthDate(profileDate, new Date()) : null;
  return (
    <div className="card stack save-block">
      <h3>{state === "saved" ? "Дата в портрете" : "Сохранить в портрет"}</h3>
      {(state === "guest" || state === "offer") && (
        <p className="muted">
          {state === "offer" && other
            ? `В портрете сейчас другая дата — ${formatBirthDateRu(other)}. Сохранить эту вместо неё?`
            : "Дата сохранится в «Моём портрете» — следующие практики возьмут её оттуда."}
        </p>
      )}
      {state === "guest" && (
        <p>
          <a
            className="button button--lavender"
            href={loginHref(MATRIX_PATH)}
            onClick={() => {
              markSaveIntent(sessionStore());
              reachGoal("matrix_save_click");
            }}
          >
            Войти и сохранить
          </a>
        </p>
      )}
      {state === "offer" && (
        <p>
          <button
            type="button"
            className="button button--lavender"
            onClick={() => {
              reachGoal("matrix_save_click");
              onSave();
            }}
          >
            Сохранить в портрет
          </button>
        </p>
      )}
      <p className="saved-note" role="status">
        {state === "saving" && "Сохраняем…"}
        {state === "saved" && (
          <>
            <CheckIcon />
            Сохранено.
          </>
        )}
      </p>
      {state === "saved" && (
        <Link className="touch-link" href="/portret">
          Открыть портрет
        </Link>
      )}
      {state === "error" && (
        <>
          <p className="error" role="alert">
            Не получилось сохранить. Проверьте интернет и попробуйте ещё раз.
          </p>
          <p>
            <button type="button" className="button button--lavender" onClick={onSave}>
              Повторить
            </button>
          </p>
        </>
      )}
    </div>
  );
}
