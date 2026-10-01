"use client";

export type TocItem = { id: string; title: string };

// Оглавление страницы значения: боковой список на компьютере и раскрывающийся список на телефоне.
// Если раздел свёрнут (details), он раскрывается перед переходом
export function DetailToc({ items }: { items: readonly TocItem[] }) {
  function open(id: string) {
    const target = document.getElementById(id);
    if (target instanceof HTMLDetailsElement) target.open = true;
  }
  const list = (
    <ol>
      {items.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`} onClick={() => open(item.id)}>
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <nav className="detail-toc" aria-label="На этой странице">
      <details className="detail-toc__fold">
        <summary>На этой странице</summary>
        {list}
      </details>
      <div className="detail-toc__side">
        <p>На этой странице</p>
        {list}
      </div>
    </nav>
  );
}
