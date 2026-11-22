import type { WeekdayPlanet } from "./weekday-planets";

// Спека картинки «Планета дня» для сторис: день недели, планета, образ и вопрос для себя. Личных данных нет: всё одинаково для всех
export type WeekdayPosterSpec = {
  weekday: true;
  day: string;
  subtitle: string;
  image: string;
  archetype: string;
  questionLabel: string;
  question: string;
  footer: string;
  fileName: string;
};

export function weekdayPosterSpec(planet: WeekdayPlanet): WeekdayPosterSpec {
  return {
    weekday: true,
    day: planet.day,
    subtitle: `День ${planet.planetGenitive}`,
    image: `/images/weekday/${planet.glyph}-768.webp`,
    archetype: planet.archetype,
    questionLabel: "Вопрос для себя",
    question: planet.question,
    footer: "ТВОЙ ОРАКУЛ · TVOY-ORAKUL.RU",
    fileName: `den-nedeli-${planet.slug}`,
  };
}
