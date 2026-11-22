"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MOON_PATH } from "@/lib/moon-paths";
import { isSectionCurrent, SECTIONS } from "@/lib/sections";

// Основная навигация по практикам: на компьютере в шапке, на телефоне — в меню по кнопке
export function HeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Меню закрывается при переходе на другую страницу и по Escape (фокус возвращается на кнопку)
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav className="site-nav" aria-label="Основная навигация">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} aria-current={isSectionCurrent(pathname, section) ? "page" : undefined}>
            {section.href === MOON_PATH && (
              <svg className="site-nav__moon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                <path d="M11.5 2.2A6 6 0 1 0 13.8 10 4.8 4.8 0 0 1 11.5 2.2Z" fill="currentColor" />
              </svg>
            )}
            {section.short}
          </Link>
        ))}
      </nav>
      <div className="site-header__actions">
        <Link href="/portret" className="site-header__account" aria-label="Мой портрет">
          <span className="site-header__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M5.5 19.5c1.2-3.3 3.6-5 6.5-5s5.3 1.7 6.5 5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="site-header__account-label">Мой портрет</span>
        </Link>
        <button ref={toggleRef} type="button" className="site-header__menu" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Закрыть меню" : "Открыть меню"} onClick={() => setOpen((value) => !value)}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      <nav id="mobile-nav" className="site-mobile-nav" aria-label="Навигация на телефоне" hidden={!open}>
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} aria-current={isSectionCurrent(pathname, section) ? "page" : undefined}>
            {section.title}
          </Link>
        ))}
      </nav>
    </>
  );
}
