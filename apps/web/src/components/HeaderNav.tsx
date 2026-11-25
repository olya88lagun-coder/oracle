"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { MOON_PATH } from "@/lib/moon-paths";
import { isSectionCurrent, NAV_MORE, NAV_PRIMARY, SECTIONS, type Section } from "@/lib/sections";

function MoonIcon() {
  return (
    <svg className="site-nav__moon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M11.5 2.2A6 6 0 1 0 13.8 10 4.8 4.8 0 0 1 11.5 2.2Z" fill="currentColor" />
    </svg>
  );
}

function NavLink({ section, pathname, label }: { section: Section; pathname: string; label: string }) {
  return (
    <Link href={section.href} aria-current={isSectionCurrent(pathname, section) ? "page" : undefined}>
      {section.href === MOON_PATH && <MoonIcon />}
      {label}
    </Link>
  );
}

// Основная навигация по практикам: на компьютере — 5 пунктов + «Ещё», на телефоне — полный список в меню по кнопке
export function HeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreToggleRef = useRef<HTMLButtonElement>(null);
  const moreMenuId = useId();
  const moreCurrent = NAV_MORE.some((section) => isSectionCurrent(pathname, section));

  // Меню закрывается при переходе на другую страницу и по Escape (фокус возвращается на кнопку)
  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open && !moreOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (moreOpen) {
        setMoreOpen(false);
        moreToggleRef.current?.focus();
        return;
      }
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (event: MouseEvent | PointerEvent) => {
      if (moreRef.current?.contains(event.target as Node)) return;
      setMoreOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [moreOpen]);

  return (
    <>
      <nav className="site-nav" aria-label="Основная навигация">
        {NAV_PRIMARY.map((section) => (
          <NavLink key={section.href} section={section} pathname={pathname} label={section.short} />
        ))}
        <div className="site-nav__more" ref={moreRef}>
          <button
            ref={moreToggleRef}
            type="button"
            className="site-nav__more-toggle"
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            aria-controls={moreMenuId}
            aria-current={moreCurrent ? "true" : undefined}
            onClick={() => setMoreOpen((value) => !value)}
          >
            Ещё
            <span className="site-nav__more-caret" aria-hidden="true">
              ▾
            </span>
          </button>
          <div id={moreMenuId} className="site-nav__more-menu" role="menu" hidden={!moreOpen}>
            {NAV_MORE.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                role="menuitem"
                aria-current={isSectionCurrent(pathname, section) ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
              >
                {section.short}
              </Link>
            ))}
          </div>
        </div>
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
          <NavLink key={section.href} section={section} pathname={pathname} label={section.title} />
        ))}
      </nav>
    </>
  );
}
