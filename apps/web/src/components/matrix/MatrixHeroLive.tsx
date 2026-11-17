"use client";

import type { Matrix } from "@oracle/core";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { nextHero, rollDelay, rollValue, ROLL_MS, type HeroState } from "@/lib/matrix-hero";
import { DIAGRAM_LINES, DIAGRAM_POINTS, DIAGRAM_SIZE, KEY_POINTS, keyArcana } from "@/lib/matrix-view";
import { MATRIX_DATE_ID } from "./matrix-ids";

type Shown = Readonly<Record<string, number>>;

const byPoint = new Map(DIAGRAM_POINTS.map((p) => [p.point, p]));
const KEY_ORDER: readonly string[] = KEY_POINTS.map(({ point }) => point);
// Путь блика: Личность → Центр → Задача
const COMET = ["A", "E", "D"].map((point) => byPoint.get(point as never)!);
const FLASH_MS = 2400;
const TILT_DEGREES = 3;

const shownOf = (matrix: Matrix): Shown => Object.fromEntries(DIAGRAM_POINTS.map(({ point }) => [point, matrix[point]]));
const motionAllowed = () => window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches ?? false;

// Диаграмма первого экрана: пример на вымышленной дате, а после ввода настоящей — матрица человека, числа «прокручиваются».
// Целиком aria-hidden: результат для чтения — таблица и карточки ниже. Оформление — Codex (docs/design/codex-brief-matrix-live-hero.md)
export function MatrixHeroLive({ value }: { value: string }) {
  const [hero, setHero] = useState<HeroState>(() => nextHero(value, new Date(), null));
  const [shown, setShown] = useState<Shown>(() => shownOf(hero.matrix));
  const [phase, setPhase] = useState<"idle" | "rolling">("idle");
  const [flash, setFlash] = useState(false);
  const [run, setRun] = useState(0);
  const [visible, setVisible] = useState(true);
  const figureRef = useRef<HTMLElement>(null);
  const heroRef = useRef(hero);
  const shownRef = useRef(shown);
  const visibleRef = useRef(true);
  // Дата, пришедшая из портрета, браузера или с главной, появляется без «прокрутки»: прокручиваем только то, что человек ввёл сам
  const typedRef = useRef(false);
  const frameRef = useRef(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const first = useRef(true);

  const flashKeys = () => {
    clearTimeout(flashTimer.current);
    setFlash(true);
    flashTimer.current = setTimeout(() => setFlash(false), FLASH_MS);
  };

  useEffect(() => {
    const mark = (event: Event) => {
      if (event.target instanceof Element && event.target.id === MATRIX_DATE_ID) typedRef.current = true;
    };
    document.addEventListener("input", mark, true);
    return () => document.removeEventListener("input", mark, true);
  }, []);

  useEffect(() => {
    const figure = figureRef.current;
    const onVisibility = () => {
      visibleRef.current = visibleRef.current && document.visibilityState === "visible";
      setVisible(visibleRef.current);
    };
    const observer = typeof IntersectionObserver === "undefined" || !figure ? null : new IntersectionObserver(([entry]) => {
      if (!entry) return;
      visibleRef.current = entry.isIntersecting && document.visibilityState === "visible";
      setVisible(visibleRef.current);
    });
    if (figure) observer?.observe(figure);
    document.addEventListener("visibilitychange", onVisibility);
    if (motionAllowed()) flashKeys();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(frameRef.current);
      clearTimeout(flashTimer.current);
    };
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const next = nextHero(value, new Date(), heroRef.current);
    if (next === heroRef.current) return;
    heroRef.current = next;
    setHero(next);
    setRun((count) => count + 1);
    cancelAnimationFrame(frameRef.current);
    const from = shownRef.current;
    const to = shownOf(next.matrix);
    const settle = () => {
      shownRef.current = to;
      setShown(to);
      setPhase("idle");
    };
    if (!motionAllowed() || !typedRef.current || !visibleRef.current) {
      settle();
      return;
    }
    flashKeys();
    setPhase("rolling");
    const start = performance.now();
    const total = ROLL_MS + rollDelay(DIAGRAM_POINTS.length - 1);
    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= total) {
        settle();
        return;
      }
      const frame = Object.fromEntries(DIAGRAM_POINTS.map(({ point }, index) => [point, rollValue(from[point] ?? 1, to[point] ?? 1, (elapsed - rollDelay(index)) / ROLL_MS)]));
      shownRef.current = frame;
      setShown(frame);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [value]);

  // Наклон за курсором: только мышь, без «меньше движения»; на телефоне переменные остаются нулевыми
  useEffect(() => {
    const figure = figureRef.current;
    if (!figure || !window.matchMedia?.("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = figure.getBoundingClientRect();
        const clamp = (n: number) => Math.max(-1, Math.min(1, n));
        figure.style.setProperty("--tilt-x", (clamp((event.clientX - rect.left - rect.width / 2) / rect.width) * TILT_DEGREES).toFixed(2));
        figure.style.setProperty("--tilt-y", (clamp((event.clientY - rect.top - rect.height / 2) / rect.height) * TILT_DEGREES).toFixed(2));
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      figure.style.setProperty("--tilt-x", "0");
      figure.style.setProperty("--tilt-y", "0");
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <figure ref={figureRef} className="matrix-live" aria-hidden="true" data-state={hero.kind} data-phase={phase} data-visible={visible ? "true" : "false"} data-run={run}>
      <figcaption className="matrix-live__caption">{hero.caption}</figcaption>
      <svg className="matrix-live__svg" viewBox={`0 0 ${DIAGRAM_SIZE} ${DIAGRAM_SIZE}`} focusable="false">
        <circle className="matrix-live__ring" cx={DIAGRAM_SIZE / 2} cy={DIAGRAM_SIZE / 2} r={DIAGRAM_SIZE / 2 - 18} />
        {DIAGRAM_LINES.map(([from, to], index) => {
          const a = byPoint.get(from)!;
          const b = byPoint.get(to)!;
          return <line key={`${from}-${to}`} className="matrix-live__line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} pathLength={1} style={{ "--i": index } as CSSProperties} />;
        })}
        <polyline className="matrix-live__comet" points={COMET.map((p) => `${p.x},${p.y}`).join(" ")} pathLength={1} />
        {DIAGRAM_POINTS.map(({ point, x, y, r, tier }, index) => (
          <g key={point} data-point={point} className={`matrix-live__point matrix-live__point--${tier}${flash && tier === "key" ? " is-flash" : ""}`} style={{ "--i": index, "--k": Math.max(0, KEY_ORDER.indexOf(point)) } as CSSProperties}>
            <circle cx={x} cy={y} r={r} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
              {shown[point]}
            </text>
          </g>
        ))}
      </svg>
      <ul className="matrix-live__keys">
        {keyArcana(hero.matrix).map((key) => (
          <li key={key.point} className="matrix-live__key">
            <span className="matrix-live__key-label">{key.label}</span> <span className="matrix-live__key-name">{key.name}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
