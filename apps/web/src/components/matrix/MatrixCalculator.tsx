"use client";

import {
  calculateMatrix,
  formatBirthDateRu,
  parseBirthDate,
  toIsoDate,
} from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { reachGoal } from "@/lib/analytics";
import { COMPAT_PATH } from "@/lib/compat";
import {
  browserStorage,
  pickBirthDate,
  readStoredBirthDate,
  storeBirthDate,
} from "@/lib/birth-date-storage";
import {
  DATE_ERROR,
  saveBlockState,
  sessionStore,
  takeSaveIntent,
  type SaveStatus,
} from "@/lib/matrix-save";
import { FREE_RESULT_PROMISE } from "@/lib/practices";
import { offerState, type PaidReport } from "@/lib/report-offer";
import { MATRIX_DATE_ID, MATRIX_FORM_ID } from "./matrix-ids";
import { MatrixResult } from "./MatrixResult";
import { ReportOffer } from "./ReportOffer";
import { SaveBlock } from "./SaveBlock";
import { ShareButton } from "./ShareButton";

// paidReports: продажа разбора включена; paid — уже купленные разборы этого пользователя (по датам)
type Props = {
  signedIn: boolean;
  profileDate: string | null;
  intro: ReactNode;
  paidReports: boolean;
  paid: readonly PaidReport[];
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function MatrixCalculator({
  signedIn,
  profileDate: initialProfileDate,
  intro,
  paidReports,
  paid,
}: Props) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileDate, setProfileDate] = useState(initialProfileDate);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Защита от двойного клика: второй запрос попал бы под лимит и показал бы ложную ошибку
  const savingRef = useRef(false);

  const parsed = useMemo(
    () => (date ? parseBirthDate(date, new Date()) : null),
    [date],
  );
  const matrix = useMemo(
    () => (parsed ? calculateMatrix(parsed) : null),
    [parsed],
  );

  // true — дата в портрете; покупка разбора ждёт этого ответа
  const save = useCallback(async (iso: string): Promise<boolean> => {
    if (savingRef.current) return false;
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
        return false;
      }
      reachGoal("birth_date_saved");
      setProfileDate(iso);
      setStatus("idle");
      return true;
    } catch {
      setStatus("error");
      return false;
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
    if (
      takeSaveIntent(sessionStore()) &&
      signedIn &&
      !initialProfileDate &&
      stored
    )
      void save(stored);
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
      headingRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
      headingRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <>
      <section className="matrix-hero" aria-labelledby="matrix-title">
        <picture className="matrix-hero__art">
          <source
            media="(max-width: 700px)"
            srcSet="/images/matrix/matrix-stone-mobile.webp"
          />
          {/* Декоративный кадр: пустой alt. Первый экран страницы, поэтому грузится с приоритетом */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/matrix/matrix-stone.webp"
            alt=""
            width={1536}
            height={1024}
            fetchPriority="high"
          />
        </picture>
        <div className="matrix-wrap matrix-hero__inner">
          <div className="matrix-hero__copy">
            {intro}
            <form
              id={MATRIX_FORM_ID}
              className="matrix-form"
              onSubmit={calculate}
              noValidate
            >
              <div className="field">
                <label htmlFor={MATRIX_DATE_ID}>Дата рождения</label>
                <div className="matrix-form__row">
                  <input
                    ref={inputRef}
                    id={MATRIX_DATE_ID}
                    className="input"
                    type="date"
                    min="1900-01-01"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                  <button type="submit" className="button button--lavender">
                    Рассчитать матрицу
                  </button>
                </div>
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <p className="matrix-form__promise">{FREE_RESULT_PROMISE}</p>
              <p className="matrix-form__note">
                Считается в вашем браузере — дату мы не получаем.
              </p>
            </form>
          </div>
        </div>
      </section>
      <div className="matrix-band">
        <ul className="matrix-wrap matrix-band__list">
          <li>
            <strong>22 аркана</strong> <span>на вашей диаграмме</span>
          </li>
          <li>
            <strong>3 ключевые точки</strong>{" "}
            <span>личность, центр и задача</span>
          </li>
          <li>
            <strong>Без регистрации</strong> <span>бесплатный расчёт</span>
          </li>
        </ul>
      </div>

      {matrix && parsed && date && (
        <div className="matrix-wrap matrix-result-wrap stack">
          <MatrixResult
            matrix={matrix}
            dateLabel={formatBirthDateRu(parsed)}
            headingRef={headingRef}
            offer={
              <OfferSlot
                state={offerState({
                  enabled: paidReports,
                  signedIn,
                  date,
                  profileDate,
                  paid,
                })}
                matrix={matrix}
                onSaveDate={() =>
                  profileDate === date ? Promise.resolve(true) : save(date)
                }
              />
            }
            actions={
              <div className="matrix-actions">
                <SaveBlock
                  state={saveBlockState({
                    signedIn,
                    profileDate,
                    date,
                    status,
                  })}
                  profileDate={profileDate}
                  onSave={() => void save(date)}
                />
                <ShareButton arcanum={arcanumByNumber(matrix.E)} />
                <Link className="touch-link" href={COMPAT_PATH}>
                  Проверить совместимость с партнёром
                </Link>
              </div>
            }
          />
        </div>
      )}
    </>
  );
}

function OfferSlot({
  state,
  ...rest
}: { state: ReturnType<typeof offerState> } & Omit<
  Parameters<typeof ReportOffer>[0],
  "state"
>) {
  return state.kind === "hidden" ? null : (
    <ReportOffer state={state} {...rest} />
  );
}
