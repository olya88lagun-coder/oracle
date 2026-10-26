import Link from "next/link";
import { YEAR_PATH } from "@/lib/year-arcana";
import { YEAR_PROMO } from "@/lib/year-arcana-promo";

// Мягкая ссылка на бесплатный расчёт аркана года: на главной — отдельная полоса, в таро — на готовых классах моста к матрице
export function YearPromo({ context, id }: { context: "home" | "taro"; id: string }) {
  const copy = YEAR_PROMO[context];
  const link = (
    <Link className="button button--lavender" href={YEAR_PATH}>
      {YEAR_PROMO.cta}
    </Link>
  );
  if (context === "taro") {
    return (
      <aside className="taro-bridge" aria-labelledby={id}>
        <h2 id={id}>{copy.title}</h2>
        <p>{copy.text}</p>
        <p>{link}</p>
      </aside>
    );
  }
  return (
    <section className="home-year" aria-labelledby={id}>
      <div className="home-year__copy">
        <p className="eyebrow">{YEAR_PROMO.home.eyebrow}</p>
        <h2 id={id}>{copy.title}</h2>
        <p>{copy.text}</p>
      </div>
      <p className="home-year__cta">{link}</p>
    </section>
  );
}
