import Link from "next/link";
import { THREAD_PATH, THREAD_PROMO } from "@/lib/life-thread";

// Полоса на главной: мягкая ссылка на бесплатный график судьбы. Показывается, только пока страница открыта (решает главная)
export function ThreadPromo({ id }: { id: string }) {
  return (
    <section className="home-year home-thread" aria-labelledby={id}>
      <div className="home-year__copy">
        <svg className="home-thread__art" viewBox="0 0 220 44" aria-hidden="true" focusable="false">
          <path d="M2 30 C 24 30 28 10 52 10 S 84 36 110 30 S 150 4 176 12 S 204 34 218 22" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
          <circle cx="110" cy="30" r="3" fill="var(--lavender)" />
        </svg>
        <p className="eyebrow">{THREAD_PROMO.eyebrow}</p>
        <h2 id={id}>{THREAD_PROMO.title}</h2>
        <p>{THREAD_PROMO.text}</p>
      </div>
      <p className="home-year__cta">
        <Link className="button button--lavender" href={THREAD_PATH}>
          {THREAD_PROMO.cta}
        </Link>
      </p>
    </section>
  );
}
