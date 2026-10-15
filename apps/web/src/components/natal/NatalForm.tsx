"use client";

import type { City } from "@oracle/geo";
import { useEffect, useId, useState, type Ref } from "react";
import { browserStorage, readStoredBirthDate } from "@/lib/birth-date-storage";
import {
  BUTTON_CALCULATE,
  BUTTON_CALCULATING,
  ERROR_CALCULATION,
  FORM_LABEL,
  LABEL_DATE,
  LABEL_TIME,
  LABEL_UNKNOWN_TIME,
  PRIVACY_LINE,
} from "@/lib/natal-copy";
import type { NatalField } from "@/lib/natal-input";
import { CityField } from "./CityField";

// Форма данных рождения. Значения и ошибки хранит NatalCalculator; здесь только разметка полей и две побочные операции после загрузки:
// подстановка даты, которую человек уже вводил на калькуляторе матрицы, и верхняя граница даты («сегодня» у зрителя).
// Из хранилища браузера дата только читается — эта страница в него ничего не пишет.

export type NatalFormValues = {
  date: string; // ГГГГ-ММ-ДД или пусто
  time: string; // ЧЧ:ММ или пусто
  unknownTime: boolean;
  cityText: string; // что напечатано в поле города
  city: City | null; // выбранный в списке город
};
export type NatalFormErrors = Readonly<Record<NatalField, string | null>>;

export const EMPTY_FORM_VALUES: NatalFormValues = { date: "", time: "", unknownTime: false, cityText: "", city: null };
export const NO_FORM_ERRORS: NatalFormErrors = { date: null, time: null, city: null };

const MIN_DATE = "1900-01-01";

// Сегодняшний день по календарю зрителя: ГГГГ-ММ-ДД
function localIsoDate(now: Date): string {
  const pad = (value: number, width: number) => String(value).padStart(width, "0");
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}`;
}

type Props = {
  values: NatalFormValues;
  errors: NatalFormErrors;
  busy: boolean; // расчёт идёт
  failed: boolean; // расчёт закончился ошибкой
  note?: string; // сообщение для живой области статуса, когда расчёт не идёт (например, «выберите время»)
  onChange: (patch: Partial<NatalFormValues>) => void;
  onSubmit: () => void;
  onCityBlur?: () => void;
  dateRef?: Ref<HTMLInputElement>;
  timeRef?: Ref<HTMLInputElement>;
  cityRef?: Ref<HTMLInputElement>;
};

export function NatalForm({ values, errors, busy, failed, note = "", onChange, onSubmit, onCityBlur, dateRef, timeRef, cityRef }: Props) {
  const baseId = useId();
  const [maxDate, setMaxDate] = useState<string | undefined>(undefined);
  const ids = { date: `${baseId}-date`, time: `${baseId}-time`, dateError: `${baseId}-date-error`, timeError: `${baseId}-time-error` };

  useEffect(() => {
    const now = new Date();
    setMaxDate(localIsoDate(now));
    // Дата с калькулятора матрицы: только если поле ещё пустое (человек мог успеть ввести свою)
    if (values.date === "") {
      const stored = readStoredBirthDate(browserStorage(), now);
      if (stored) onChange({ date: stored });
    }
    // Только один раз, после загрузки страницы
  }, []);

  return (
    <form
      className="natal-form"
      aria-label={FORM_LABEL}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="natal-form__fields">
        <div className={`natal-field${errors.date ? " natal-field--error" : ""}`}>
          <label htmlFor={ids.date}>{LABEL_DATE}</label>
          <input
            id={ids.date}
            name="date"
            type="date"
            min={MIN_DATE}
            max={maxDate}
            value={values.date}
            ref={dateRef}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={errors.date ? ids.dateError : undefined}
            onChange={(event) => onChange({ date: event.target.value })}
          />
          {errors.date && (
            <p className="natal-field__error" id={ids.dateError} role="alert">
              {errors.date}
            </p>
          )}
        </div>
        <div className={`natal-field${errors.time ? " natal-field--error" : ""}`}>
          <label htmlFor={ids.time}>{LABEL_TIME}</label>
          <input
            id={ids.time}
            name="time"
            type="time"
            value={values.unknownTime ? "" : values.time}
            disabled={values.unknownTime}
            ref={timeRef}
            aria-invalid={errors.time ? true : undefined}
            aria-describedby={errors.time ? ids.timeError : undefined}
            onChange={(event) => onChange({ time: event.target.value })}
          />
          {errors.time && (
            <p className="natal-field__error" id={ids.timeError} role="alert">
              {errors.time}
            </p>
          )}
          <label className="natal-unknown-time">
            <input type="checkbox" name="unknown-time" checked={values.unknownTime} onChange={(event) => onChange({ unknownTime: event.target.checked })} />
            <span>{LABEL_UNKNOWN_TIME}</span>
          </label>
        </div>
        <CityField
          value={values.cityText}
          selected={values.city}
          error={errors.city}
          inputRef={cityRef}
          onTextChange={(cityText) => onChange({ cityText, ...(values.city && cityText !== values.city.name ? { city: null } : {}) })}
          onSelect={(city) => onChange({ city, cityText: city.name })}
          onBlur={onCityBlur}
        />
      </div>
      <div className="natal-form__bottom">
        {/* Пока город не выбран из списка, кнопка не работает (как в макете) */}
        <button className="natal-button natal-button--calculate" type="submit" disabled={busy || values.city === null}>
          {busy ? BUTTON_CALCULATING : BUTTON_CALCULATE}
        </button>
        <p className="natal-status" role="status" aria-live="polite">
          {busy ? BUTTON_CALCULATING : note}
        </p>
        {failed && (
          <p className="natal-form__error" role="alert">
            {ERROR_CALCULATION}
          </p>
        )}
      </div>
      <p className="natal-form__privacy">{PRIVACY_LINE}</p>
    </form>
  );
}
