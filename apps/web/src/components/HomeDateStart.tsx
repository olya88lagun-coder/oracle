"use client";

import { parseBirthDate, toIsoDate } from "@oracle/core";
import Link from "next/link";
import { useRef, useState } from "react";
import { DATE_ERROR, sessionStore } from "@/lib/matrix-save";
import { FREE_MATRIX_CTA } from "@/lib/practices";
import { prepareMatrixHandoff } from "@/lib/year-arcana";
import { MATRIX_PATH } from "@/lib/arcana-paths";

const RU_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

// Поле на главной принимает привычный для RU вид дд.мм.гггг (и ISO на всякий случай); в матрицу уходит ISO через вкладку
export function parseHomeBirthInput(raw: string, today: Date): string | null {
  const value = raw.trim();
  if (!value) return null;
  const isoDirect = parseBirthDate(value, today);
  if (isoDirect) return toIsoDate(isoDirect);
  const match = RU_DATE.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsed = parseBirthDate(iso, today);
  return parsed ? toIsoDate(parsed) : null;
}

// Дата прямо на главной: введённая дата переходит в матрицу через вкладку (prepareMatrixHandoff, как с /arkan-2027), и матрица сразу показывает результат.
// Без даты кнопка работает как раньше — просто ведёт к калькулятору. Дата не попадает в адрес и никуда не отправляется
export function HomeDateStart() {
  const input = useRef<HTMLInputElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const [error, setError] = useState("");

  function start(event: React.MouseEvent) {
    const raw = input.current?.value ?? "";
    if (!raw.trim()) return;
    const iso = parseHomeBirthInput(raw, new Date());
    if (!iso) {
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
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          placeholder="дд.мм.гггг"
          maxLength={10}
          spellCheck={false}
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
