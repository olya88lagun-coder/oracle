"use client";

import { calculateMatrix, formatBirthDateRu, parseBirthDate, toIsoDate } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { reachGoal } from "@/lib/analytics";
import { browserStorage, pickBirthDate, readStoredBirthDate, storeBirthDate } from "@/lib/birth-date-storage";
import { DATE_ERROR, saveBlockState, sessionStore, takeSaveIntent, type SaveStatus } from "@/lib/matrix-save";
import { MatrixResult } from "./MatrixResult";
import { SaveBlock } from "./SaveBlock";
import { ShareButton } from "./ShareButton";

type Props = { signedIn: boolean; profileDate: string | null; intro: ReactNode };

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function MatrixCalculator({ signedIn, profileDate: initialProfileDate, intro }: Props) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileDate, setProfileDate] = useState(initialProfileDate);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Защита от двойного клика: второй запрос попал бы под лимит и показал бы ложную ошибку
  const savingRef = useRef(false);

  const parsed = useMemo(() => (date ? parseBirthDate(date, new Date()) : null), [date]);
  const matrix = useMemo(() => (parsed ? calculateMatrix(parsed) : null), [parsed]);

  const save = useCallback(async (iso: string) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setStatus("saving");
    try {
      const response = await fetch("/api/profile/birth-date", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ birthDate: iso }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      reachGoal("birth_date_saved");
      setProfileDate(iso);
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      savingRef.current = false;
    }
  }, []);

  // Дата из портрета или из браузера; после «Войти и сохранить» — сохраняем браузерную дату в пустой портрет
  useEffect(() => {
    const storage = browserStorage();
    const stored = readStoredBirthDate(storage, new Date());
    const picked = pickBirthDate({ profile: initialProfileDate, stored });
    if (picked.date) {
      setValue(picked.date);
      setDate(picked.date);
      storeBirthDate(storage, picked.date);
    }
    if (takeSaveIntent(sessionStore()) && signedIn && !initialProfileDate && stored) void save(stored);
  }, [initialProfileDate, signedIn, save]);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Дату читаем из поля: её могли ввести до гидратации, когда onChange ещё не работал и состояние пустое
    const raw = inputRef.current?.value ?? value;
    setValue(raw);
    const next = parseBirthDate(raw, new Date());
    if (!next) {
      // Прежний результат убираем: рядом с ошибкой он выглядел бы как расчёт по новой дате
      setError(DATE_ERROR);
      setDate(null);
      setStatus("idle");
      return;
    }
    const iso = toIsoDate(next);
    setError(null);
    setStatus("idle");
    setDate(iso);
    storeBirthDate(browserStorage(), iso);
    reachGoal("matrix_calculated");
    requestAnimationFrame(() => {
      headingRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <>
      <section className="matrix-hero">
        {intro}
        <form className="card stack matrix-form" onSubmit={calculate} noValidate>
          <div className="field">
            <label htmlFor="matrix-date">Дата рождения</label>
            <input ref={inputRef} id="matrix-date" className="input" type="date" min="1900-01-01" value={value} onChange={(event) => setValue(event.target.value)} />
          </div>
          <button type="submit" className="button button--lavender">
            Рассчитать
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <p className="muted">Считается в вашем браузере — дату мы не получаем.</p>
        </form>
      </section>

      {matrix && parsed && date && (
        <MatrixResult
          matrix={matrix}
          dateLabel={formatBirthDateRu(parsed)}
          headingRef={headingRef}
          actions={
            <div className="matrix-actions">
              <SaveBlock state={saveBlockState({ signedIn, profileDate, date, status })} profileDate={profileDate} onSave={() => void save(date)} />
              <ShareButton arcanum={arcanumByNumber(matrix.E)} />
            </div>
          }
        />
      )}
    </>
  );
}
