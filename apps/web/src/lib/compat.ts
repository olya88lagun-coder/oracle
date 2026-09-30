import { KEY_POINTS, type Compatibility, type KeyPoint } from "@oracle/core";
import { SITE_URL } from "./site";

export const COMPAT_PATH = "/sovmestimost";
// Ссылка приглашения общая: в ней нет ни дат, ни результата
export const COMPAT_SHARE_URL = `${SITE_URL}${COMPAT_PATH}?utm_source=share&utm_medium=partner`;
export const COMPAT_SHARE_TEXT = "Давай проверим нашу совместимость по дате рождения";

export const POINT_LABELS: Readonly<Record<KeyPoint, string>> = { personality: "Личность", center: "Центр", task: "Задача" };

// Фразы фиксированные: сводка не выносит оценок, а только называет совпадения
export function compatSummary(compat: Compatibility, nameOf: (arcanum: number) => string): string[] {
  const lines: string[] = [];
  for (const point of KEY_POINTS) {
    if (!compat.sameAtPoint.includes(point)) continue;
    const arcanum = compat.people[0][point];
    lines.push(`У вас совпадает ${POINT_LABELS[point].toLowerCase()}: аркан ${arcanum} «${nameOf(arcanum)}».`);
  }
  const elsewhere = compat.sharedArcana.filter((arcanum) => !compat.sameAtPoint.some((point) => compat.people[0][point] === arcanum));
  if (elsewhere.length > 0) {
    lines.push(`Есть общие арканы в разных точках: ${elsewhere.map((arcanum) => `${arcanum} «${nameOf(arcanum)}»`).join(", ")}. Возможно, у вас эта тема проявляется по-разному.`);
  }
  if (lines.length === 0) {
    lines.push("Ваши арканы не пересекаются. Это не хорошо и не плохо: скорее повод узнать друг у друга то, чего нет у вас самих.");
  }
  return lines;
}
