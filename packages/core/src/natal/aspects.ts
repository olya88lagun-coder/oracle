import { type BodyId } from "./bodies";
import { angularDistance } from "./zodiac";

export const ASPECTS = [
  { id: "conjunction", angle: 0 },
  { id: "sextile", angle: 60 },
  { id: "square", angle: 90 },
  { id: "trine", angle: 120 },
  { id: "opposition", angle: 180 },
] as const;
export type AspectId = (typeof ASPECTS)[number]["id"];

export type Aspect = { a: BodyId; b: BodyId; aspect: AspectId; orb: number };

const LUMINARY_ORB = 8;
const OTHER_ORB = 6;
const maxOrb = (body: BodyId) => (body === "sun" || body === "moon" ? LUMINARY_ORB : OTHER_ORB);

// Мажорные аспекты; допуск — больший из допусков двух тел; сначала самые точные
export function findAspects(longitudes: Readonly<Record<BodyId, number>>, bodies: readonly BodyId[]): Aspect[] {
  const found: Aspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i] as BodyId;
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j] as BodyId;
      const distance = angularDistance(longitudes[a], longitudes[b]);
      const allowed = Math.max(maxOrb(a), maxOrb(b));
      for (const aspect of ASPECTS) {
        const orb = Math.abs(distance - aspect.angle);
        if (orb <= allowed) found.push({ a, b, aspect: aspect.id, orb });
      }
    }
  }
  return found.sort((x, y) => x.orb - y.orb);
}
