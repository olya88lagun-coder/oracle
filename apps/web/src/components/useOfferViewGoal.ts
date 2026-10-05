"use client";

import { useEffect, useRef } from "react";
import { reachGoal, type Goal } from "@/lib/analytics";

// Цель «блок продажи показан» — один раз за показ страницы, когда заголовок блока хотя бы наполовину на экране.
// Следим за заголовком, а не за всем блоком: на телефоне блок выше двух экранов и «наполовину виден» не наступал бы никогда
export function useOfferViewGoal(goal: Goal, enabled: boolean) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (reachGoal(goal)) observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [goal, enabled]);
  return ref;
}
