"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

export type TocItem = { id: string; title: string };
type Props = { items: readonly TocItem[]; email: string };

// Отступ сверху, до которого заголовок раздела считается «текущим»
const ACTIVE_OFFSET = 100;

// Оглавление: на компьютере — колонка слева с подсветкой раздела, на телефоне — раскрывающийся список под заголовком
export function DocumentToc({ items, email }: Props) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);
  const mobile = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    let pending = false;
    const mark = () => {
      pending = false;
      const headings = items.map((item) => document.getElementById(item.id)).filter((node): node is HTMLElement => node !== null);
      if (headings.length === 0) return;
      const atEnd = window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const current = atEnd ? headings.at(-1)! : (headings.findLast((heading) => heading.getBoundingClientRect().top <= ACTIVE_OFFSET) ?? headings[0]!);
      setActive(current.id);
    };
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(mark);
    };
    mark();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  const links = (label: string, onPick?: () => void) => (
    <nav aria-label={label}>
      {items.map((item) => (
        <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined} onClick={onPick}>
          {item.title}
        </a>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="document-sidebar">
        {links("Оглавление")}
        <a className="sidebar-mail" href={`mailto:${email}`}>
          <Icon name="mail" size={18} />
          Написать нам
        </a>
      </aside>
      <details ref={mobile} className="mobile-toc">
        <summary>
          Содержание
          <Icon name="chevron-down" size={18} />
        </summary>
        {links("Оглавление документа", () => {
          if (mobile.current) mobile.current.open = false;
        })}
      </details>
    </>
  );
}
