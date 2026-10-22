import type { NatalChapterOutline } from "@oracle/core/natal-report";
import { ANGLE_NAMES, BODY_NAMES, OFFER_ASPECTS_LABEL, OFFER_HOUSES_LABEL, OFFER_SCENARIO_LABEL, inSign } from "./natal-copy";

// Состояние блока продажи под результатом калькулятора: скрыт (продажа выключена), нет времени рождения, гость или вошедший
export type NatalOfferState = { kind: "hidden" } | { kind: "no_time" } | { kind: "guest" } | { kind: "buy" };

export function natalOfferState(p: { enabled: boolean; signedIn: boolean; timeKnown: boolean }): NatalOfferState {
  if (!p.enabled) return { kind: "hidden" };
  if (!p.timeKnown) return { kind: "no_time" };
  return p.signedIn ? { kind: "buy" } : { kind: "guest" };
}

// Положение человека одной строкой: «Венера в Водолее, 8 дом»; у асцендента дома нет — «Асцендент в Раке»
export function pointLabel(point: NatalChapterOutline["points"][number]): string {
  const name = point.body === "ascendant" ? ANGLE_NAMES.ascendant : BODY_NAMES[point.body];
  return point.house === null ? `${name} ${inSign(point.sign)}` : `${name} ${inSign(point.sign)}, ${point.house} дом`;
}

// Дома главы без планет: «7 дом» или «Дома 2, 6 и 10»
export function housesLabel(houses: readonly number[]): string {
  if (houses.length === 1) return `${houses[0]} дом`;
  return `Дома ${houses.slice(0, -1).join(", ")} и ${houses.at(-1)}`;
}

// Подпись главы в оглавлении: положения человека («Венера в Водолее, 8 дом») или, у глав без точек, о чём глава
export function chapterLabel(outline: NatalChapterOutline): string {
  if (outline.points.length > 0) return outline.points.map(pointLabel).join(" · ");
  if (outline.id === "work") return OFFER_HOUSES_LABEL;
  if (outline.id === "aspects") return OFFER_ASPECTS_LABEL;
  return OFFER_SCENARIO_LABEL;
}
