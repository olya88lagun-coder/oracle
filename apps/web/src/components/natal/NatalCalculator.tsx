"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ERROR_CITY_REQUIRED, NOTICE_AMBIGUOUS } from "@/lib/natal-copy";
import { planCalculation } from "@/lib/natal-calc";
import { validateAll, validateNatalInput, type NatalField, type NatalInput } from "@/lib/natal-input";
import type { ZoneChoice } from "@/lib/natal-moment";
import { EMPTY_FORM_VALUES, NO_FORM_ERRORS, NatalForm, type NatalFormErrors, type NatalFormValues } from "./NatalForm";
import { NatalOutcome, type Outcome } from "./NatalOutcome";

// Калькулятор натальной карты: форма, плашки и результат. Всё считается в браузере; на сервер уходит только поиск города (GET /api/cities).
// Дата, время и выбранный город живут в состоянии компонента — ни в адресе, ни в хранилище браузера, ни в запросах их нет.
// Ядро расчёта (~47 КБ gzip) подгружается отдельным куском после нажатия «Рассчитать карту».

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
  // Куда вести фокус после расчёта: на обёртку с результатом и плашками или, если нужен выбор времени, на группу выбора
  const [reveal, setReveal] = useState<{ target: "outcome" | "choice"; count: number }>({ target: "outcome", count: 0 });
  const titleId = `${useId()}-result-title`;
  const run = useRef(0); // номер расчёта: ответ устаревшего расчёта отбрасывается
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);
  const choiceRef = useRef<HTMLDivElement>(null);

  // После расчёта переносим фокус и прокрутку: плашки над результатом не должны остаться выше экрана
  useEffect(() => {
    if (reveal.count === 0) return;
    const target = reveal.target === "choice" ? choiceRef.current : outcomeRef.current;
    target?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    target?.focus({ preventScroll: true });
  }, [reveal]);

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
        setReveal((current) => ({ target: "choice", count: current.count + 1 }));
        return;
      }
      setOutcome({ input, chart: planned.chart, clock: planned.clock, correctedTime: planned.correctedTime, choice });
      setReveal((current) => ({ target: "outcome", count: current.count + 1 }));
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

  return (
    <>
      <NatalForm
        values={values}
        errors={errors}
        busy={busy}
        failed={failed}
        note={outcome && !outcome.chart ? NOTICE_AMBIGUOUS : ""}
        onChange={change}
        onSubmit={submit}
        onCityBlur={cityBlurred}
        dateRef={dateRef}
        timeRef={timeRef}
        cityRef={cityRef}
      />
      {outcome && (
        <NatalOutcome
          outcome={outcome}
          titleId={titleId}
          outcomeRef={outcomeRef}
          choiceRef={choiceRef}
          onChoose={(choice) => void calculate(outcome.input, choice)}
          onRecalculate={recalculate}
        />
      )}
    </>
  );
}
