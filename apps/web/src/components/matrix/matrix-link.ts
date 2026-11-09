import type { Matrix } from "@oracle/core";
import { arcanumByNumber, type Arcanum } from "@oracle/content";
import { teaserText } from "@/lib/report-offer";

// Бесплатный пример связки — глава «Отношения» платного разбора в три уровня: числа → общее значение каждой точки → связка.
// shortcut: связка собрана по шаблону из ключевых слов и списков «В ресурсе» / «В перекосе» обоих арканов,
// своих текстов на 22×22 сочетаний нет; в разборе эти же точки связывает ИИ-редактор
export type LinkPoint = { role: string; number: number; name: string; meaning: string };
export type MatrixLink = { points: readonly [LinkPoint, LinkPoint]; link: string };

const MEANING_LIMIT = 160;

const point = (role: string, arcanum: Arcanum): LinkPoint => ({ role, number: arcanum.number, name: arcanum.name, meaning: teaserText(arcanum.love[0] ?? "", MEANING_LIMIT) });

export function relationshipLink(matrix: Matrix): MatrixLink {
  const love = arcanumByNumber(matrix.love);
  const heart = arcanumByNumber(matrix.heart);
  const points = [point("Точка любви", love), point("Сердце матрицы", heart)] as const;
  // Одна и та же точка дважды: берём разные пункты списков, чтобы фраза не повторяла саму себя
  const same = love.number === heart.number;
  const second = (list: readonly string[]) => list[same ? 1 : 0] ?? "";
  const opening = same
    ? `Обе точки — ${love.name}: тема «${love.keywords[0]}» звучит в отношениях вдвойне.`
    : `В отношениях у вас встречаются «${love.keywords[0]}» (${love.name}) и «${heart.keywords[0]}» (${heart.name}).`;
  const link = `${opening} На что можно опереться вдвоём: «${love.resource[0]}» и «${second(heart.resource)}». Перекос, который легко не заметить: «${love.distortion[0]}» и «${second(heart.distortion)}».`;
  return { points, link };
}
