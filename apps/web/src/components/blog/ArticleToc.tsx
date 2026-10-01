"use client";

import { useEffect, useState } from "react";

type Item = { id: string; text: string };

// Оглавление строится по заголовкам второго уровня уже готовой статьи: текст остаётся на сервере, оглавление — улучшение
export function ArticleToc({ targetId }: { targetId: string }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const headings = [...document.querySelectorAll<HTMLHeadingElement>(`#${targetId} h2`)];
    setItems(
      headings.map((heading, index) => {
        if (!heading.id) heading.id = `razdel-${index + 1}`;
        return { id: heading.id, text: heading.textContent ?? "" };
      }),
    );
  }, [targetId]);

  if (items.length < 2) return null;
  const list = (
    <ol>
      {items.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`}>{item.text}</a>
        </li>
      ))}
    </ol>
  );
  return (
    <nav className="blog-toc" aria-label="Оглавление статьи">
      <details className="blog-toc__fold">
        <summary>В статье</summary>
        {list}
      </details>
      <div className="blog-toc__side">
        <p>В статье</p>
        {list}
      </div>
    </nav>
  );
}
