import type { NatalChart } from "@oracle/core/natal";
import { SPHERES_INTRO, SPHERES_TITLE, SPHERE_EMPTY, SPHERE_PLANETS_LABEL, SPHERE_SIGN_LABEL, sphereCards } from "@/lib/natal-spheres";

// «Сферы жизни в вашей карте»: дома простым языком — знак на границе дома и планеты в нём (lib/natal-spheres.ts).
// Без времени рождения домов нет, и блока тоже
export function NatalSpheres({ chart }: { chart: NatalChart }) {
  const cards = sphereCards(chart);
  if (cards.length === 0) return null;
  return (
    <section className="natal-spheres">
      <h3>{SPHERES_TITLE}</h3>
      <p className="natal-spheres__intro">{SPHERES_INTRO}</p>
      <div className="natal-spheres__items">
        {cards.map((card) => (
          <article key={card.id} className="natal-spheres__item" data-house={card.house}>
            <p className="natal-spheres__eyebrow">{card.house} дом</p>
            <h4 className="natal-spheres__title">{card.title}</h4>
            <p className="natal-spheres__text">{card.text}</p>
            <p className="natal-spheres__meta">
              {SPHERE_SIGN_LABEL}: {card.signName}
            </p>
            <p className="natal-spheres__meta">{card.planets.length > 0 ? `${SPHERE_PLANETS_LABEL}: ${card.planets.join(", ")}` : SPHERE_EMPTY}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
