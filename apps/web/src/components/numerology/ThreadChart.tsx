"use client";

import type { LifeThread, ThreadPeriod } from "@oracle/core";
import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { clearsHoverOnLeave, curveLevels, labelEvery as labelStep, nowPillBelow, smoothPath, threadWindow, YEAR_NAMES } from "@/lib/life-thread-curve";

// Нить личных годов (эталон — docs/design/mockups/thread/thread-premium.html). Цвета только через переменные;
// размер в пикселях экрана: ширина viewBox равна ширине блока, поэтому подписи на телефоне не мельче 14 px.
const ROMAN = ["I", "II", "III", "IV"] as const;
const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

type Mode = "window" | "all";
type Band = { readonly index: 1 | 2 | 3 | 4; readonly from: number; readonly to: number; readonly open: boolean };

function layout(width: number) {
  const narrow = width < 560;
  const height = narrow ? 380 : 450;
  const edge = narrow ? 32 : 50;
  return { width, height, x0: edge, x1: width - edge, top: height * 0.29, bottom: height * 0.77, tickY: height * 0.87, bandTop: height * 0.14, narrow };
}

// Периоды, которые пересекают показанные годы; границы — календарные годы, на границе стоит день рождения
function visibleBands(periods: readonly ThreadPeriod[], first: number, last: number): Band[] {
  return periods.flatMap((period) => {
    const from = Math.max(period.fromYear, first);
    const to = Math.min(period.toYear ?? last, last);
    return from < to || (period.toYear === null && period.fromYear <= last) ? [{ index: period.index, from, to: Math.max(to, from), open: period.toYear === null }] : [];
  });
}

export function ThreadChart({ thread, initialMode = "window" }: { thread: LifeThread; initialMode?: Mode }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [mode, setMode] = useState<Mode>(initialMode);
  const [width, setWidth] = useState(1000);
  const [measured, setMeasured] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const reveal = useRef<SVGRectElement>(null);
  const head = useRef<SVGCircleElement>(null);
  const nowMark = useRef<SVGGElement>(null);

  const years = threadWindow(thread.years, thread.currentYear, mode);
  const levels = curveLevels(years.map((item) => item.value));
  const g = layout(width);
  const firstYear = years[0]?.year ?? thread.currentYear;
  const lastYear = years.at(-1)?.year ?? firstYear;
  const step = years.length > 1 ? (g.x1 - g.x0) / (years.length - 1) : 0;
  const px = (year: number): number => g.x0 + (year - firstYear) * step;
  const py = (i: number): number => g.bottom - (levels[i] ?? 0) * (g.bottom - g.top);
  const points = years.map((item, i) => ({ x: px(item.year), y: py(i) }));
  const line = smoothPath(points);
  const area = `${line} L${g.x1.toFixed(1)},${(g.bottom + 30).toFixed(1)} L${g.x0.toFixed(1)},${(g.bottom + 30).toFixed(1)} Z`;
  const nowIndex = clamp(thread.currentYear - firstYear, 0, years.length - 1);
  const nowPoint = points[nowIndex] ?? { x: g.x0, y: g.bottom };
  const nowValue = years[nowIndex]?.value ?? 1;
  const bands = visibleBands(thread.periods, firstYear, lastYear);
  const labelEvery = labelStep(mode, g.narrow, step);
  const pillOffset = nowPillBelow(nowPoint.y, g.bottom) ? 42 : -42;
  const nowFraction = (nowPoint.x - g.x0) / Math.max(1, g.x1 - g.x0);
  const geometry = useRef({ x0: g.x0, x1: g.x1 });
  geometry.current = { x0: g.x0, x1: g.x1 };

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const update = () => {
      setWidth(Math.max(300, Math.round(element.clientWidth)));
      setMeasured(true);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // «Рисование» нити; при «меньше движения» и до замера нить сразу готова
  useLayoutEffect(() => {
    const rect = reveal.current;
    const dot = head.current;
    const mark = nowMark.current;
    const curve = path.current;
    if (!rect || !dot || !mark || !curve || !measured) return;
    const peaks = Array.from(svg.current?.querySelectorAll<SVGGElement>(".thread-peak") ?? []);
    const finish = () => {
      rect.setAttribute("width", "100000");
      dot.setAttribute("opacity", "0");
      mark.setAttribute("opacity", "1");
      peaks.forEach((peak) => peak.setAttribute("opacity", "1"));
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    const length = curve.getTotalLength();
    const yAt = (x: number): number => {
      let low = 0;
      let high = length;
      for (let k = 0; k < 22; k++) {
        const middle = (low + high) / 2;
        if (curve.getPointAtLength(middle).x < x) low = middle;
        else high = middle;
      }
      return curve.getPointAtLength(high).y;
    };
    rect.setAttribute("width", "0");
    mark.setAttribute("opacity", "0");
    peaks.forEach((peak) => peak.setAttribute("opacity", "0"));
    const duration = 3400;
    let start: number | null = null;
    let frame = 0;
    const tick = (time: number) => {
      start ??= time;
      const p = Math.min(1, (time - start) / duration);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
      const { x0, x1 } = geometry.current;
      const x = x0 + eased * (x1 - x0);
      rect.setAttribute("width", String(x + 12));
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(yAt(x)));
      dot.setAttribute("opacity", p < 1 ? "1" : "0");
      peaks.forEach((peak) => {
        if (x >= Number(peak.dataset.x)) peak.setAttribute("opacity", "1");
      });
      const markX = Number(mark.dataset.x);
      if (x > markX) mark.setAttribute("opacity", String(Math.min(1, (x - markX) / 60)));
      if (p < 1) frame = requestAnimationFrame(tick);
      else finish();
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      finish();
    };
  }, [measured, mode, thread]);

  useEffect(() => setHover(null), [mode]);

  function scrub(event: PointerEvent<SVGRectElement>) {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect || years.length === 0) return;
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * g.width;
    setHover(clamp(Math.round(step ? (x - g.x0) / step : 0), 0, years.length - 1));
  }

  const hovered = hover === null ? null : years[hover];
  const hoverPoint = hover === null ? null : points[hover];
  return <div className="thread-chart" ref={box}>
    <svg ref={svg} className="thread-svg" viewBox={`0 0 ${g.width} ${g.height}`} width={g.width} height={g.height} role="img" aria-label={`Линия жизни по годам: личные годы ${firstYear}–${lastYear}. Подробности — в таблице под картинкой.`}>
      <defs>
        <linearGradient id={`${uid}thr`} gradientUnits="userSpaceOnUse" x1={g.x0} y1="0" x2={g.x1} y2="0">
          <stop offset="0" style={{ stopColor: "var(--accent-soft)", stopOpacity: 0.55 }} />
          <stop offset={clamp(nowFraction - 0.2, 0, 1)} style={{ stopColor: "var(--accent)" }} />
          <stop offset={clamp(nowFraction, 0, 1)} style={{ stopColor: "var(--thread-glint)" }} />
          <stop offset={clamp(nowFraction + 0.22, 0, 1)} style={{ stopColor: "var(--accent)", stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0.08 }} />
        </linearGradient>
        <linearGradient id={`${uid}fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.22 }} />
          <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id={`${uid}band`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.09 }} />
          <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id={`${uid}mist`} gradientUnits="userSpaceOnUse" x1={nowPoint.x + 60} y1="0" x2={g.x1} y2="0">
          <stop offset="0" style={{ stopColor: "var(--bg)", stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: "var(--bg)", stopOpacity: 0.5 }} />
        </linearGradient>
        <radialGradient id={`${uid}halo`}>
          <stop offset="0" style={{ stopColor: "var(--lavender)", stopOpacity: 0.9 }} />
          <stop offset="0.4" style={{ stopColor: "var(--lavender)", stopOpacity: 0.25 }} />
          <stop offset="1" style={{ stopColor: "var(--lavender)", stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id={`${uid}head`}>
          <stop offset="0" style={{ stopColor: "var(--thread-glint)" }} />
          <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
        </radialGradient>
        <filter id={`${uid}blur`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
        <clipPath id={`${uid}reveal`}><rect ref={reveal} x="0" y="0" width="100000" height={g.height} /></clipPath>
      </defs>

      {bands.map((band) => {
        const a = px(band.from);
        const z = px(band.to);
        const label = `${ROMAN[band.index - 1]} период${band.open ? " · и дальше" : ""}`;
        return <g key={band.index} className="thread-band">
          <rect x={a} y={g.bandTop} width={Math.max(0, z - a)} height={g.tickY - g.bandTop} fill={`url(#${uid}band)`} />
          <line x1={a} y1={g.bandTop} x2={a} y2={g.tickY} className="thread-band__edge" />
          {z - a >= label.length * 10 && <text x={(a + z) / 2} y={g.bandTop + 20} className="thread-band__label" textAnchor="middle">{label}</text>}
        </g>;
      })}

      {[g.top, (g.top + g.bottom) / 2, g.bottom].map((y) => <line key={y} x1={g.x0} y1={y} x2={g.x1} y2={y} className="thread-grid" />)}
      {!g.narrow && <><text x={g.x0 + 6} y={g.top - 8} className="thread-axis">высоко</text><text x={g.x0 + 6} y={g.bottom - 8} className="thread-axis">тихо</text></>}

      {years.map((item, i) => <g key={item.year}>
        <line x1={px(item.year)} y1={g.tickY - 6} x2={px(item.year)} y2={g.tickY} className="thread-tick" />
        {((i % labelEvery === 0 && Math.abs(item.year - thread.currentYear) >= Math.ceil(labelEvery / 2)) || item.year === thread.currentYear) && <text x={px(item.year)} y={g.tickY + 20} className={item.year === thread.currentYear ? "thread-year thread-year--now" : "thread-year"} textAnchor="middle">{item.year}</text>}
      </g>)}

      <g clipPath={`url(#${uid}reveal)`}>
        <path d={area} fill={`url(#${uid}fill)`} />
        <path d={line} fill="none" stroke={`url(#${uid}thr)`} strokeWidth="9" strokeLinecap="round" filter={`url(#${uid}blur)`} opacity=".75" />
        <path ref={path} d={line} fill="none" stroke={`url(#${uid}thr)`} strokeWidth="2.4" strokeLinecap="round" />
      </g>
      {nowPoint.x + 60 < g.x1 && <rect x={nowPoint.x + 60} y={g.bandTop} width={g.x1 - nowPoint.x - 60 + 10} height={g.tickY - g.bandTop} fill={`url(#${uid}mist)`} pointerEvents="none" />}

      {years.map((item, i) => item.value === 8 && <g key={item.year} className="thread-peak" data-x={px(item.year)}>
        <circle cx={px(item.year)} cy={py(i)} r="5" className="thread-peak__ring" />
        {mode === "window" && <text x={px(item.year)} y={py(i) - 14} className="thread-peak__label" textAnchor="middle">{`${item.year} · урожай`}</text>}
      </g>)}

      <g ref={nowMark} data-x={nowPoint.x}>
        <circle className="thread-halo" cx={nowPoint.x} cy={nowPoint.y} r="34" fill={`url(#${uid}halo)`} />
        <circle cx={nowPoint.x} cy={nowPoint.y} r="10" className="thread-now__ring" />
        <circle cx={nowPoint.x} cy={nowPoint.y} r="3.6" className="thread-now__dot" />
        <g transform={`translate(${clamp(nowPoint.x, 84, g.width - 84)},${nowPoint.y + pillOffset})`}>
          <rect x="-80" y="-15" width="160" height="30" rx="15" className="thread-now__pill" />
          <text y="5" className="thread-now__text" textAnchor="middle">{`Вы здесь · год ${nowValue}`}</text>
        </g>
      </g>

      <circle ref={head} r="16" fill={`url(#${uid}head)`} opacity="0" pointerEvents="none" />

      {hovered && hoverPoint && <g className="thread-tip" pointerEvents="none">
        <line x1={hoverPoint.x} y1={g.bandTop} x2={hoverPoint.x} y2={g.tickY} className="thread-tip__line" />
        <circle cx={hoverPoint.x} cy={hoverPoint.y} r="5" className="thread-tip__dot" />
        <g transform={`translate(${clamp(hoverPoint.x, 88, g.width - 88)},${Math.max(hoverPoint.y - 14, 62)})`}>
          <rect x="-84" y="-48" width="168" height="44" rx="12" className="thread-tip__box" />
          <text y="-29" className="thread-tip__year" textAnchor="middle">{`${hovered.year} · год ${hovered.value}`}</text>
          <text y="-11" className="thread-tip__name" textAnchor="middle">{YEAR_NAMES[hovered.value]}</text>
        </g>
      </g>}
      <rect x="0" y="0" width={g.width} height={g.height} fill="transparent" onPointerMove={scrub} onPointerDown={scrub} onPointerLeave={(event) => { if (clearsHoverOnLeave(event.pointerType)) setHover(null); }} />
    </svg>
    <div className="thread-controls">
      <button className="button button--ghost thread-toggle" type="button" aria-pressed={mode === "all"} onClick={() => setMode(mode === "all" ? "window" : "all")}>Вся жизнь</button>
    </div>
    <details className="thread-table">
      <summary>Таблица по годам</summary>
      <table>
        <caption className="visually-hidden">Личные годы по годам</caption>
        <thead><tr><th scope="col">Год</th><th scope="col">Личный год</th><th scope="col">Тема</th></tr></thead>
        <tbody>
          {years.map((item) => <tr key={item.year} data-year={item.year} aria-current={item.year === thread.currentYear ? "date" : undefined}>
            <th scope="row">{item.year}</th><td>{item.value}</td><td>{YEAR_NAMES[item.value]}</td>
          </tr>)}
        </tbody>
      </table>
    </details>
  </div>;
}
