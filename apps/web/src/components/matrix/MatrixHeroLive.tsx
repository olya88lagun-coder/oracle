"use client";

import type { Matrix } from "@oracle/core";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { nextHero, PASS_LEAD_MS, passSchedule, rollDelay, rollTotal, rollValue, ROLL_MS, type HeroState } from "@/lib/matrix-hero";
import { DIAGRAM_LINES, DIAGRAM_POINTS, DIAGRAM_SIZE, KEY_POINTS, keyArcana } from "@/lib/matrix-view";
import { MATRIX_DATE_ID } from "./matrix-ids";

type Shown = Readonly<Record<string, number>>;

const byPoint = new Map(DIAGRAM_POINTS.map((p) => [p.point, p]));
const KEY_ORDER: readonly string[] = KEY_POINTS.map(({ point }) => point);
// Путь блика: Личность → Центр → Задача
const COMET = ["A", "E", "D"].map((point) => byPoint.get(point as never)!);
// Первый проход света при загрузке начинается, когда линии и узлы уже нарисованы
const PASS_INTRO_MS = 900;
const TILT_DEGREES = 3;

const shownOf = (matrix: Matrix): Shown => Object.fromEntries(DIAGRAM_POINTS.map(({ point }) => [point, matrix[point]]));
const motionAllowed = () => window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches ?? false;

// Диаграмма первого экрана: пример на вымышленной дате, а после ввода настоящей — матрица человека, числа «прокручиваются».
// Целиком aria-hidden: результат для чтения — таблица и карточки ниже. Оформление — Codex (docs/design/codex-brief-matrix-live-hero.md)
export function MatrixHeroLive({ value }: { value: string }) {
  const [hero, setHero] = useState<HeroState>(() => nextHero(value, new Date(), null));
  const [shown, setShown] = useState<Shown>(() => shownOf(hero.matrix));
  const [phase, setPhase] = useState<"idle" | "rolling">("idle");
  // Проход света: «wait» — ждём остановки чисел, «run» — свет идёт, «done»/«idle» — готово (до скрипта всё уже тёплое)
  const [pass, setPass] = useState<"idle" | "wait" | "run" | "done">("idle");
  // Сколько ключевых точек уже согрето светом (Личность, Центр, Задача); их подписи теплеют вместе с узлами
  const [lit, setLit] = useState(3);
  const [run, setRun] = useState(0);
  const [visible, setVisible] = useState(true);
  const figureRef = useRef<HTMLElement>(null);
  const heroRef = useRef(hero);
  const shownRef = useRef(shown);
  const visibleRef = useRef(true);
  // Дата, пришедшая из портрета, браузера или с главной, появляется без «прокрутки»: прокручиваем только то, что человек ввёл сам
  const typedRef = useRef(false);
  const frameRef = useRef(0);
  const passTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const first = useRef(true);

  const clearPass = () => {
    passTimers.current.forEach(clearTimeout);
    passTimers.current = [];
  };
  const finishPass = () => {
    clearPass();
    setLit(3);
    setPass("done");
  };
  // Один проход света Личность → Центр → Задача через `delay` мс: узел и его подпись теплеют в момент касания
  const startPass = (delay: number) => {
    clearPass();
    setLit(0);
    setPass("wait");
    passSchedule(delay).litAt.forEach((at, index) => {
      passTimers.current.push(
        setTimeout(() => {
          setLit(index + 1);
          setPass(index === 2 ? "done" : "run");
        }, at),
      );
    });
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
    // Диаграмма «живая», только пока она на экране и вкладка открыта; обе причины считаем отдельно, иначе возврат во вкладку не включит её снова
    let onScreen = true;
    const update = () => {
      visibleRef.current = onScreen && document.visibilityState === "visible";
      setVisible(visibleRef.current);
    };
    const observer = typeof IntersectionObserver === "undefined" || !figure ? null : new IntersectionObserver(([entry]) => {
      if (!entry) return;
      onScreen = entry.isIntersecting;
      update();
    });
    if (figure) observer?.observe(figure);
    document.addEventListener("visibilitychange", update);
    if (motionAllowed()) startPass(PASS_INTRO_MS);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
      cancelAnimationFrame(frameRef.current);
      clearPass();
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
    if (!motionAllowed() || !visibleRef.current) {
      settle();
      finishPass();
      return;
    }
    // Дата без ввода (с главной, из портрета): числа сразу на месте, свет проходит один раз
    if (!typedRef.current) {
      settle();
      startPass(PASS_INTRO_MS);
      return;
    }
    setPhase("rolling");
    const start = performance.now();
    const total = rollTotal(DIAGRAM_POINTS.length);
    // Свет пойдёт, когда последнее число встало на место
    startPass(total + PASS_LEAD_MS);
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
    <figure ref={figureRef} className="matrix-live" aria-hidden="true" data-state={hero.kind} data-phase={phase} data-pass={pass} data-lit={lit} data-visible={visible ? "true" : "false"} data-run={run}>
      <figcaption className="matrix-live__caption">{hero.caption}</figcaption>
      <svg className="matrix-live__svg" viewBox={`0 0 ${DIAGRAM_SIZE} ${DIAGRAM_SIZE}`} focusable="false">
        <defs>
          {/* Металл линий и кольца: от тёмной бронзы к светлому золоту; цвета из переменных, на них опирается оформление */}
          <linearGradient id="matrix-live-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--line-strong)" }} />
            <stop offset="55%" style={{ stopColor: "var(--accent)" }} />
            <stop offset="100%" style={{ stopColor: "var(--accent-hover)" }} />
          </linearGradient>
        </defs>
        <circle className="matrix-live__ring" cx={DIAGRAM_SIZE / 2} cy={DIAGRAM_SIZE / 2} r={DIAGRAM_SIZE / 2 - 18} />
        {DIAGRAM_LINES.map(([from, to], index) => {
          const a = byPoint.get(from)!;
          const b = byPoint.get(to)!;
          return <line key={`${from}-${to}`} className="matrix-live__line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} pathLength={1} style={{ "--i": index } as CSSProperties} />;
        })}
        <polyline className="matrix-live__comet" points={COMET.map((p) => `${p.x},${p.y}`).join(" ")} pathLength={1} />
        {DIAGRAM_POINTS.map(({ point, x, y, r, tier }, index) => (
          <g key={point} data-point={point} className={`matrix-live__point matrix-live__point--${tier}${tier === "key" && KEY_ORDER.indexOf(point) < lit ? " is-lit" : ""}`} style={{ "--i": index, "--k": Math.max(0, KEY_ORDER.indexOf(point)) } as CSSProperties}>
            <circle cx={x} cy={y} r={r} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
              {shown[point]}
            </text>
          </g>
        ))}
      </svg>
      <ul className="matrix-live__keys">
        {keyArcana(hero.matrix).map((key, index) => (
          <li key={key.point} className={`matrix-live__key${index < lit ? " is-lit" : ""}`}>
            <span className="matrix-live__key-label">{key.label}</span> <span className="matrix-live__key-name">{key.name}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
