import Link from "next/link";
import { acceptedNatalPages } from "@/lib/natal-pages";
import { natalPageName } from "@oracle/content/natal";
import { NATAL_PATH, natalPagePath } from "@/lib/natal-paths";
import { QUICK_PAGES, type QuickVariant } from "@/lib/natal-quick-pages";

// Текст страницы быстрого расчёта под калькулятором: разделы, значения по знакам (ссылки на страницы значений), вопросы и соседние страницы.
// Тексты — в lib/natal-quick-pages.ts; те же вопросы уходят в разметку FAQPage на странице
export function NatalQuickGuide({ variant }: { variant: QuickVariant }) {
  const page = QUICK_PAGES[variant];
  const body = variant === "moon" ? "moon" : "ascendant";
  const signs = acceptedNatalPages().filter((item) => item.body === body);
  const other = QUICK_PAGES[variant === "moon" ? "ascendant" : "moon"];
  return (
    <article className="natal-quick">
      {page.sections.map((section) => (
        <section key={section.title} className="natal-quick__section">
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
      {signs.length > 0 && (
        <section className="natal-quick__section natal-quick__signs">
          <h2>{page.signsTitle}</h2>
          <ul className="natal-quick__signs-list">
            {signs.map((item) => (
              <li key={item.slug}>
                <Link href={natalPagePath(item)}>{natalPageName(item.body, item.sign)}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="natal-quick__section">
        <h2>Частые вопросы</h2>
        <div className="natal-faq compat-faq">
          {page.faq.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <nav className="natal-quick__more" aria-label="Другие расчёты">
        <Link href={NATAL_PATH}>Полная натальная карта</Link>
        <Link href={other.path}>{other.breadcrumb}: рассчитать</Link>
        <Link href="/metodika">О текстах и методике</Link>
      </nav>
    </article>
  );
}
