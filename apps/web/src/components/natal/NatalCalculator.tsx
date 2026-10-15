"use client";

import type { NatalChart } from "@oracle/core/natal";
import { useCallback, useEffect, useRef, useState } from "react";
import { ERROR_CITY_REQUIRED } from "@/lib/natal-copy";
import { planCalculation } from "@/lib/natal-calc";
import { validateAll, validateNatalInput, type NatalField, type NatalInput } from "@/lib/natal-input";
import type { ClockKind, ZoneChoice } from "@/lib/natal-moment";
import { EMPTY_FORM_VALUES, NO_FORM_ERRORS, NatalForm, type NatalFormErrors, type NatalFormValues } from "./NatalForm";
import { NatalNotices } from "./NatalNotices";
import { NatalResult } from "./NatalResult";

// Калькулятор натальной карты: форма, плашки и результат. Всё считается в браузере; на сервер уходит только поиск города (GET /api/cities).
// Дата, время и выбранный город живут в состоянии компонента — ни в адресе, ни в хранилище браузера, ни в запросах их нет.
// Ядро расчёта (~47 КБ gzip) подгружается отдельным куском после нажатия «Рассчитать карту».

type Outcome = {
  input: NatalInput; // проверенные данные, по которым считали
  chart: NatalChart | null; // null — время было дважды, и человек ещё не выбрал
  clock: ClockKind;
  correctedTime: string | null;
  choice: ZoneChoice | null;
};

const prefersReducedMotion = (): boolean => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Какие поля формы затрагивает изменение: у них снимается показанная ошибка
function touchedFields(patch: Partial<NatalFormValues>): NatalField[] {
  const fields: NatalField[] = [];
  if ("date" in patch) fields.push("date");
  if ("time" in patch || "unknownTime" in patch) fields.push("time");
  if ("cityText" in patch || "city" in patch) fields.push("city");
  return fields;
}

export function NatalCalculator() {
  const [values, setValues] = useState<NatalFormValues>(EMPTY_FORM_VALUES);
  const [errors, setErrors] = useState<NatalFormErrors>(NO_FORM_ERRORS);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [revealed, setRevealed] = useState(0);
  const run = useRef(0); // номер расчёта: ответ устаревшего расчёта отбрасывается
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // После успешного расчёта переносим фокус на заголовок результата и прокручиваем к нему
  useEffect(() => {
    if (revealed === 0) return;
    headingRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [revealed]);

  const discardOutcome = useCallback(() => {
    run.current += 1; // расчёт, который ещё идёт, больше не нужен
    setBusy(false);
    setFailed(false);
    setOutcome(null);
  }, []);

  const change = useCallback(
    (patch: Partial<NatalFormValues>) => {
      discardOutcome(); // любое изменение поля убирает результат: он относился к прежним данным
      setValues((current) => ({ ...current, ...patch }));
      const touched = touchedFields(patch);
      setErrors((current) => (touched.some((field) => current[field] !== null) ? { ...current, ...Object.fromEntries(touched.map((field) => [field, null])) } : current));
    },
    [discardOutcome],
  );

  async function calculate(input: NatalInput, choice: ZoneChoice | null) {
    const mine = ++run.current;
    setBusy(true);
    setFailed(false);
    try {
      // Ядро расчёта и сборка момента рождения грузятся только здесь, по нажатию кнопки
      const [{ computeNatalChart }, { buildBirthMoment }] = await Promise.all([import("@oracle/core/natal"), import("@/lib/natal-moment")]);
      if (mine !== run.current) return;
      const planned = planCalculation(input, choice, { buildBirthMoment, computeNatalChart });
      if (planned.kind === "needs-choice") {
        setOutcome({ input, chart: null, clock: "ambiguous", correctedTime: null, choice: null });
        return;
      }
      setOutcome({ input, chart: planned.chart, clock: planned.clock, correctedTime: planned.correctedTime, choice });
      setRevealed((count) => count + 1);
    } catch {
      // Данные рождения в сообщение не попадают и нигде не пишутся
      if (mine === run.current) {
        setOutcome(null);
        setFailed(true);
      }
    } finally {
      if (mine === run.current) setBusy(false);
    }
  }

  function submit() {
    if (busy) return;
    const raw = { date: values.date, time: values.time, unknownTime: values.unknownTime, city: values.city };
    const now = new Date();
    const checked = validateNatalInput(raw, now);
    if (!checked.ok) {
      setErrors(validateAll(raw, now)); // сразу все ошибки, фокус — на первом неверном поле
      ({ date: dateRef, time: timeRef, city: cityRef })[checked.field].current?.focus();
      return;
    }
    setErrors(NO_FORM_ERRORS);
    discardOutcome();
    void calculate(checked.value, null);
  }

  function recalculate() {
    discardOutcome();
    dateRef.current?.focus();
  }

  // Ушли из поля города, напечатав название и не выбрав город из списка
  function cityBlurred() {
    if (values.city === null && values.cityText.trim() !== "") setErrors((current) => ({ ...current, city: ERROR_CITY_REQUIRED }));
  }

  // Время в подписи карты — то, по которому её посчитали (при переводе часов вперёд это исправленное время)
  const birth = outcome ? { city: outcome.input.city.name, date: outcome.input.date, time: outcome.input.time === null ? null : (outcome.correctedTime ?? outcome.input.time) } : null;

  return (
    <>
      <NatalForm
        values={values}
        errors={errors}
        busy={busy}
        failed={failed}
        onChange={change}
        onSubmit={submit}
        onCityBlur={cityBlurred}
        dateRef={dateRef}
        timeRef={timeRef}
        cityRef={cityRef}
      />
      {outcome && (
        <NatalNotices
          clock={outcome.clock}
          correctedTime={outcome.correctedTime}
          choice={outcome.choice}
          onChoose={(choice) => void calculate(outcome.input, choice)}
          chart={outcome.chart}
          date={outcome.input.date}
          latitude={outcome.input.city.latitude}
        />
      )}
      {outcome?.chart && birth && <NatalResult chart={outcome.chart} birth={birth} headingRef={headingRef} onRecalculate={recalculate} />}
    </>
  );
}
