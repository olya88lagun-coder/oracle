"use client";

import { parseBirthDate } from "@oracle/core";
import Link from "next/link";
import { useRef, useState } from "react";
import { DATE_ERROR, sessionStore } from "@/lib/matrix-save";
import { FREE_MATRIX_CTA } from "@/lib/practices";
import { prepareMatrixHandoff } from "@/lib/year-arcana";
import { MATRIX_PATH } from "@/lib/arcana-paths";

// Дата прямо на главной: введённая дата переходит в матрицу через вкладку (prepareMatrixHandoff, как с /arkan-2027), и матрица сразу показывает результат.
// Без даты кнопка работает как раньше — просто ведёт к калькулятору. Дата не попадает в адрес и никуда не отправляется
export function HomeDateStart() {
  const input = useRef<HTMLInputElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const [error, setError] = useState("");

  function start(event: React.MouseEvent) {
    const iso = input.current?.value ?? "";
    if (!iso) return;
    if (!parseBirthDate(iso, new Date())) {
      event.preventDefault();
      setError(DATE_ERROR);
      input.current?.focus();
      return;
    }
    prepareMatrixHandoff(sessionStore(), iso);
  }

  return (
    <>
      <div className="field hero-date">
        <label className="visually-hidden" htmlFor="home-birth-date">
          Дата рождения
        </label>
        <input
          ref={input}
          id="home-birth-date"
          className="input"
          type="date"
          min="1900-01-01"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "home-date-error" : undefined}
          onChange={() => setError("")}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            link.current?.click();
          }}
        />
        {error && (
          <p id="home-date-error" className="error" role="alert">
            {error}
          </p>
        )}
      </div>
      <p>
        <Link ref={link} className="button button--lavender" href={MATRIX_PATH} onClick={start}>
          {FREE_MATRIX_CTA}
        </Link>
      </p>
    </>
  );
}
