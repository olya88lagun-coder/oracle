"use client";

import { useState } from "react";

// Только для телефона: раскрывает или сворачивает все секции аркана разом (на компьютере они всегда открыты)
export function ExpandAll({ selector }: { selector: string }) {
  const [open, setOpen] = useState(false);
  function toggle() {
    const next = !open;
    for (const section of document.querySelectorAll<HTMLDetailsElement>(selector)) section.open = next;
    setOpen(next);
  }
  return (
    <button type="button" className="detail-expand" aria-pressed={open} onClick={toggle}>
      {open ? "Свернуть все" : "Развернуть все"}
    </button>
  );
}
