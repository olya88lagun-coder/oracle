import type { Aspect, AspectId, NatalChart, SignId } from "@oracle/core/natal";
import { BODY_NAMES, SIGN_NAMES } from "./natal-copy";
import { HOUSE_KEYWORDS, SIGN_KEYWORDS, signOfLongitude } from "./natal-wheel-card";

// «Сферы жизни» и группы аспектов: два способа прочитать карту без терминов. Сфера — это дом: показываем знак на его границе (куспиде)
// и планеты, которые в нём стоят. Аспекты делятся на опоры, напряжения и слияния. Тексты короткие, без обещаний и предсказаний.

export const SPHERES_TITLE = "Сферы жизни в вашей карте";
export const SPHERES_INTRO = "Дом карты — это сфера жизни. Для каждой сферы показаны знак на границе дома и планеты, которые в нём стоят.";
export const SPHERE_EMPTY = "Планет в этом доме нет";
export const SPHERE_PLANETS_LABEL = "Планеты в доме";
export const SPHERE_SIGN_LABEL = "Знак на границе дома";

export type Sphere = { id: string; title: string; house: number };
export const SPHERES: readonly Sphere[] = [
  { id: "love", title: "Отношения", house: 7 },
  { id: "money", title: "Деньги и ресурсы", house: 2 },
  { id: "work", title: "Дело и призвание", house: 10 },
  { id: "home", title: "Дом и семья", house: 4 },
  { id: "daily", title: "Повседневность и режим", house: 6 },
  { id: "talk", title: "Общение и учёба", house: 3 },
];

export type SphereCard = { id: string; title: string; house: number; sign: SignId; signName: string; planets: string[]; text: string };

// Без времени рождения домов нет — и карточек тоже
export function sphereCards(chart: NatalChart): SphereCard[] {
  const cusps = chart.timeKnown ? chart.houses?.cusps : undefined;
  if (!cusps) return [];
  return SPHERES.flatMap((sphere) => {
    const cusp = cusps[sphere.house - 1];
    if (cusp === undefined) return [];
    const sign = signOfLongitude(cusp);
    return [
      {
        id: sphere.id,
        title: sphere.title,
        house: sphere.house,
        sign,
        signName: SIGN_NAMES[sign],
        planets: chart.points.filter((point) => point.house === sphere.house).map((point) => BODY_NAMES[point.id]),
        text: `${capitalize(HOUSE_KEYWORDS[sphere.house] ?? "")}. Ключевые слова знака: ${SIGN_KEYWORDS[sign]}.`,
      },
    ];
  });
}

const capitalize = (value: string): string => (value === "" ? value : value[0]?.toUpperCase() + value.slice(1));

// ---------- Группы аспектов ----------

export type AspectGroup = { id: "support" | "tension" | "merge"; title: string; lead: string; aspects: readonly AspectId[] };
export const ASPECT_GROUPS: readonly AspectGroup[] = [
  { id: "support", title: "Опоры", lead: "Трин и секстиль: темы двух планет поддерживают друг друга.", aspects: ["trine", "sextile"] },
  { id: "tension", title: "Напряжения", lead: "Квадрат и оппозиция: темы тянут в разные стороны, и это нередко побуждает искать решение.", aspects: ["square", "opposition"] },
  { id: "merge", title: "Слияния", lead: "Соединение: планеты стоят рядом и действуют как единое целое.", aspects: ["conjunction"] },
];

// Аспекты по группам; внутри группы порядок карты (от самых точных), пустые группы пропускаются
export function groupAspects(aspects: readonly Aspect[]): { group: AspectGroup; aspects: Aspect[] }[] {
  return ASPECT_GROUPS.map((group) => ({ group, aspects: aspects.filter((aspect) => group.aspects.includes(aspect.aspect)) })).filter((entry) => entry.aspects.length > 0);
}
