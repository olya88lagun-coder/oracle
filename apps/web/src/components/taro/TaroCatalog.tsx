"use client";

import { TAROT_SUIT_LABELS } from "@oracle/content/tarot";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TARO_AUTHOR_CREDIT } from "@/lib/taro-paths";
import { countLabel, FILTER_CAPTIONS, FILTER_LABELS, FILTER_ORDER, isFilter, matchesQuery, SUIT_ORDER, type CatalogCard, type CatalogFilter } from "@/lib/taro-catalog";

// Каталог всех 78 карт. Сервер отдаёт все карты сразу (ссылки видны без JS); в браузере каталог по умолчанию сужается до старших арканов
export function TaroCatalog({ cards }: { cards: readonly CatalogCard[] }) {
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [query, setQuery] = useState("");
  // Адрес читаем один раз при загрузке; писать в него начинаем только после этого
  const [ready, setReady] = useState(false);
  // Масть, к которой вернёмся, когда поиск очистят
  const beforeSearch = useRef<CatalogFilter>("major");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("suit");
    const initialFilter = isFilter(fromUrl) ? fromUrl : "major";
    const initialQuery = params.get("q") ?? "";
    beforeSearch.current = initialFilter;
    setFilter(initialQuery.trim() ? "all" : initialFilter);
    setQuery(initialQuery);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Запрос и масть можно сохранить в адресе: в них нет личных данных
    const url = new URL(window.location.href);
    url.searchParams.set("suit", query.trim() ? beforeSearch.current : filter);
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    try {
      window.history.replaceState(null, "", url);
    } catch {
      // Адрес не обновится — каталог работает и так
    }
  }, [ready, filter, query]);

  const visible = useMemo(() => new Set(cards.filter((card) => (filter === "all" || card.suit === filter) && matchesQuery(card, query)).map((card) => card.slug)), [cards, filter, query]);
  const searching = query.trim().length > 0;

  function chooseFilter(next: CatalogFilter) {
    setFilter(next);
    if (searching) beforeSearch.current = next;
  }

  function changeQuery(next: string) {
    // Первый ввод расширяет поиск на всю колоду, очистка возвращает прежнюю масть
    if (!query.trim() && next.trim()) {
      beforeSearch.current = filter;
      setFilter("all");
    }
    if (query.trim() && !next.trim()) setFilter(beforeSearch.current);
    setQuery(next);
  }

  function clearSearch() {
    changeQuery("");
    inputRef.current?.focus();
  }

  function resetAll() {
    beforeSearch.current = "all";
    setQuery("");
    setFilter("all");
    inputRef.current?.focus();
  }

  return (
    <section id="znacheniya" className="matrix-wrap taro-cat" aria-labelledby="taro-cat-title">
      <div className="taro-cat__heading">
        <div>
          <h2 id="taro-cat-title">Значения карт</h2>
          <p>Классическая колода. Личный взгляд.</p>
        </div>
        <form className="taro-cat__search" role="search" onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="taro-search">
            Найти карту в колоде Таро
          </label>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" />
          </svg>
          <input
            ref={inputRef}
            id="taro-search"
            type="search"
            placeholder="Найти карту"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && query) {
                event.preventDefault();
                clearSearch();
              }
            }}
          />
          {query && (
            <button type="button" className="taro-cat__clear" aria-label="Очистить поиск" onClick={clearSearch}>
              ×
            </button>
          )}
        </form>
      </div>

      <div className="taro-cat__filters" role="group" aria-label="Масть карты">
        {FILTER_ORDER.map((item) => (
          <button key={item} type="button" aria-pressed={filter === item} onClick={() => chooseFilter(item)}>
            <span className="taro-cat__wide">{FILTER_LABELS[item].full}</span>
            <span className="taro-cat__short">{FILTER_LABELS[item].short}</span>
            <b>{item === "all" ? cards.length : cards.filter((card) => card.suit === item).length}</b>
          </button>
        ))}
      </div>

      <div className="taro-cat__meta">
        <p>{searching ? `Поиск: «${query.trim()}»` : FILTER_CAPTIONS[filter]}</p>
        <p role="status" aria-live="polite" aria-atomic="true">
          {countLabel(visible.size)}
        </p>
      </div>

      {visible.size === 0 && (
        <div className="taro-cat__empty">
          <h3>Карты не найдены</h3>
          <p>Попробуйте другое название или выберите всю колоду.</p>
          <button type="button" className="button button--ghost" onClick={resetAll}>
            Сбросить поиск
          </button>
        </div>
      )}

      {SUIT_ORDER.map((suit) => {
        const group = cards.filter((card) => card.suit === suit);
        const shown = group.filter((card) => visible.has(card.slug));
        return (
          <section key={suit} className="taro-cat__group" aria-label={TAROT_SUIT_LABELS[suit]} hidden={shown.length === 0}>
            {filter === "all" && <h3>{TAROT_SUIT_LABELS[suit]}</h3>}
            <ul className="taro-cat__grid">
              {group.map((card) => (
                <li key={card.slug} hidden={!visible.has(card.slug)}>
                  <Link href={card.path} className="taro-cat__card">
                    <span className="taro-cat__image">
                      <Image src={card.image} alt="" fill unoptimized loading="lazy" sizes="(min-width: 860px) 180px, 50vw" />
                    </span>
                    <span className="taro-cat__caption">
                      <span className="taro-cat__rank">{card.rankLabel}</span>
                      <span className="taro-cat__name">{card.name}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <p className="taro-cat__credit">{TARO_AUTHOR_CREDIT}</p>
    </section>
  );
}
