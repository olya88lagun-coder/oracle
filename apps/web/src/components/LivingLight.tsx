"use client";

import { useEffect, useRef } from "react";

// Тёплый свет мягко идёт за курсором по всему сайту. Только мышь: на телефоне и при «меньше движения» его нет (стили — .living-light в globals.css)
export function LivingLight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const light = ref.current;
    const allowed = window.matchMedia?.("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
    if (!light || !allowed) return;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const tick = () => {
      x += (targetX - x) * 0.14;
      y += (targetY - y) * 0.14;
      light.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!light.dataset.on) {
        x = targetX;
        y = targetY;
        light.dataset.on = "1";
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const leave = () => delete light.dataset.on;

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="living-light" aria-hidden="true" />;
}
