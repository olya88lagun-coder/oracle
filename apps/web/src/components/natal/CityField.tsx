"use client";

import type { City } from "@oracle/geo";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { keepOptionVisible } from "@/lib/natal-list-scroll";
import { CITY_HINT, CITY_LIST_EMPTY, CITY_LIST_ERROR, CITY_LIST_LABEL, CITY_PLACEHOLDER, LABEL_CITY, citiesFoundNote } from "@/lib/natal-copy";
import { createCitySearch, describeCities, navigateCityList, type CityOption, type CitySearch, type CityState } from "@/lib/natal-cities";

// Поле «Место рождения»: комбобокс со списком городов (шаблон ARIA «combobox со списком»). Фокус всегда остаётся в поле ввода,
// выбранный пункт указывает aria-activedescendant. Разметка — как в макете калькулятора (состояния 1–5).

type ViewProps = {
  baseId: string;
  value: string;
  state: CityState;
  open: boolean;
  options: readonly CityOption[];
  activeIndex: number; // -1 — ни один пункт не выбран
  error: string | null;
  inputRef?: Ref<HTMLInputElement>;
  onInputChange?: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onOptionClick?: (index: number) => void;
};

const optionId = (baseId: string, index: number) => `${baseId}-option-${index}`;

// Только разметка: все состояния списка (варианты, «не нашлось», ошибка) можно показать без браузера
export function CityFieldView(props: ViewProps) {
  const { baseId, state, open, options, activeIndex, error } = props;
  const listVisible = open && (state.status === "results" || state.status === "empty" || state.status === "error");
  const activeOption = listVisible && state.status === "results" && activeIndex >= 0 && activeIndex < options.length;
  const found = !listVisible ? "" : state.status === "results" ? citiesFoundNote(options.length) : state.status === "empty" ? citiesFoundNote(0) : "";
  const errorId = `${baseId}-error`;
  const helpId = `${baseId}-help`;
  const listId = `${baseId}-list`;

  return (
    <div className={`natal-field natal-city${error ? " natal-field--error" : ""}`}>
      <label htmlFor={`${baseId}-input`}>{LABEL_CITY}</label>
      <input
        className="natal-city__input"
        id={`${baseId}-input`}
        name="city"
        type="text"
        value={props.value}
        placeholder={CITY_PLACEHOLDER}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={listVisible}
        aria-controls={listId}
        aria-describedby={error ? `${helpId} ${errorId}` : helpId}
        aria-activedescendant={activeOption ? optionId(baseId, activeIndex) : undefined}
        aria-invalid={error ? true : undefined}
        ref={props.inputRef}
        onChange={(event) => props.onInputChange?.(event.target.value)}
        onKeyDown={props.onKeyDown}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
      />
      {/* mousedown по списку не отнимает фокус у поля: иначе blur закрыл бы список раньше, чем сработает click по пункту */}
      <ul className="natal-city__list" id={listId} role="listbox" aria-label={CITY_LIST_LABEL} hidden={!listVisible} onMouseDown={(event) => event.preventDefault()}>
        {listVisible && state.status === "results" &&
          options.map((option, index) => (
            <li key={option.city.id} className="natal-city__option" id={optionId(baseId, index)} role="option" aria-selected={index === activeIndex} onClick={() => props.onOptionClick?.(index)}>
              <span className="natal-city__marker" aria-hidden="true">
                {index === activeIndex ? "✓" : ""}
              </span>
              <span>
                {option.name}
                <span className="natal-city__region">{option.regionLine}</span>
              </span>
            </li>
          ))}
        {listVisible && state.status === "empty" && (
          <li role="presentation">
            <p className="natal-city__empty">{CITY_LIST_EMPTY}</p>
          </li>
        )}
        {listVisible && state.status === "error" && (
          <li role="presentation">
            <p className="natal-city__error" role="alert">
              {CITY_LIST_ERROR}
            </p>
          </li>
        )}
      </ul>
      {error && (
        <p className="natal-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
      <p className="natal-field__help" id={helpId}>
        {CITY_HINT}
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {found}
      </p>
    </div>
  );
}

type Props = {
  value: string; // текст в поле
  selected: City | null;
  error: string | null;
  inputRef?: Ref<HTMLInputElement>;
  onTextChange: (text: string) => void; // человек печатает: выбранный город сбрасывает родитель
  onSelect: (city: City) => void;
  onBlur?: () => void;
};

const IDLE_STATE: CityState = { status: "idle" };

export function CityField({ value, selected, error, inputRef, onTextChange, onSelect, onBlur }: Props) {
  const baseId = useId();
  const searchRef = useRef<CitySearch | null>(null);
  const [state, setState] = useState<CityState>(IDLE_STATE);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    // Запрос уходит только на наш /api/cities; fetch вызывается лишь после паузы в наборе
    const search = createCitySearch({ fetchImpl: (input, init) => fetch(input, init) });
    searchRef.current = search;
    const stop = search.subscribe((next) => {
      setState(next);
      setActiveIndex(next.status === "results" ? 0 : -1); // первый вариант сразу выбран: Enter берёт его
    });
    return () => {
      stop();
      search.dispose();
      searchRef.current = null;
    };
  }, []);

  const options = useMemo(() => (state.status === "results" ? describeCities(state.cities) : []), [state]);

  // Пункт, выбранный стрелками, остаётся в видимой части списка (на узком экране список прокручивается)
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const option = document.getElementById(optionId(baseId, activeIndex));
    if (option?.parentElement) keepOptionVisible(option.parentElement, option);
  }, [open, activeIndex, baseId, options]);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    searchRef.current?.reset();
    setOpen(false);
    onSelect(option.city);
  }

  function handleInput(text: string) {
    onTextChange(text);
    setOpen(true);
    searchRef.current?.search(text);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const visible = open && (state.status === "results" || state.status === "empty" || state.status === "error");
    const action = navigateCityList({ key: event.key, visible, count: options.length, active: activeIndex });
    if (!action.handled) return;
    event.preventDefault();
    setOpen(action.open);
    setActiveIndex(action.active);
    if (action.select !== null) choose(action.select);
  }

  return (
    <CityFieldView
      baseId={baseId}
      value={value}
      state={state}
      open={open}
      options={options}
      activeIndex={activeIndex}
      error={error}
      inputRef={inputRef}
      onInputChange={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={() => {
        if (!selected && state.status !== "idle" && state.status !== "loading") setOpen(true);
      }}
      onBlur={() => {
        setOpen(false);
        onBlur?.();
      }}
      onOptionClick={choose}
    />
  );
}
