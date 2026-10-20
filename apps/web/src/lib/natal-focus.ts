import type { Aspect, AspectId, BodyId, NatalChart, SignId } from "@oracle/core/natal";
import { ASPECT_NAMES, BODY_NAMES, SIGN_ORDER, formatOrb, inSign } from "./natal-copy";
import { BODY_KEYWORDS, SIGN_KEYWORDS } from "./natal-wheel-card";

// «Главная точка карты»: то, что в карте заметнее всего, выбирается из самих данных — самый тесный аспект и стеллиум (три планеты и больше
// в одном знаке). Ничего не придумывается: нет аспектов или нет скопления — блока нет. Тексты короткие, без обещаний и предсказаний;
// подробности — на страницах значений и в платном разборе.

export const FOCUS_TITLE = "Главная точка карты";
export const FOCUS_ASPECT_EYEBROW = "Самый тесный аспект";
export const FOCUS_STELLIUM_EYEBROW = "Стеллиум";
const FOCUS_ORB_NOTE = "Чем ближе угол к точному, тем заметнее эта связь в карте.";
const FOCUS_STELLIUM_NOTE = "Когда несколько планет собраны в одном знаке, астрологи называют это стеллиумом: тема знака в карте звучит особенно заметно.";
export const FOCUS_REPORT_LINE = "О самых точных связях планет вашей карты подробнее — в платном разборе ниже.";

export const FOCUS_ASPECT_LINES: Readonly<Record<AspectId, string>> = {
  conjunction: "Планеты стоят рядом и действуют как единое целое: их темы переплетены.",
  sextile: "Мягкая связь: две темы могут поддерживать друг друга, если обращать на них внимание.",
  square: "Напряжение между двумя темами: оно побуждает действовать и искать решение.",
  trine: "Согласие двух тем: они поддерживают друг друга без усилий, и это нередко воспринимается как естественный талант.",
  opposition: "Противостояние двух тем: нередко оно ощущается как качели между полюсами и поиск равновесия.",
};

const STELLIUM_MINIMUM = 3;
const COUNT_WORDS: Readonly<Record<number, string>> = { 3: "Три", 4: "Четыре", 5: "Пять", 6: "Шесть", 7: "Семь", 8: "Восемь", 9: "Девять", 10: "Десять" };

export type NatalFocus = { aspect: Aspect | null; stellium: { sign: SignId; bodies: BodyId[] } | null };
export type FocusItem = { kind: "aspect" | "stellium"; eyebrow: string; title: string; meta: string | null; text: string };

// Самый тесный аспект — с наименьшим орбисом; при равенстве — тот, что раньше в списке карты
function tightestAspect(chart: NatalChart): Aspect | null {
  return chart.aspects.reduce<Aspect | null>((best, aspect) => (best === null || aspect.orb < best.orb ? aspect : best), null);
}

// Стеллиум: знак с тремя и более планетами (лунный узел не планета; тела, чей знак мог смениться за сутки без времени рождения, не считаются).
// Побеждает знак с наибольшим числом планет, при равенстве — идущий раньше по зодиаку
function findStellium(chart: NatalChart): NatalFocus["stellium"] {
  const uncertain = new Set<string>(chart.uncertainSigns);
  const bySign = new Map<SignId, BodyId[]>();
  for (const point of chart.points) {
    if (point.id === "northNode" || uncertain.has(point.id)) continue;
    bySign.set(point.sign, [...(bySign.get(point.sign) ?? []), point.id]);
  }
  let best: { sign: SignId; bodies: BodyId[] } | null = null;
  for (const sign of SIGN_ORDER) {
    const bodies = bySign.get(sign) ?? [];
    if (bodies.length >= STELLIUM_MINIMUM && (best === null || bodies.length > best.bodies.length)) best = { sign, bodies };
  }
  return best;
}

export const findFocus = (chart: NatalChart): NatalFocus => ({ aspect: tightestAspect(chart), stellium: findStellium(chart) });

const joinNames = (names: readonly string[]): string => (names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} и ${names[names.length - 1]}`);

function aspectItem(aspect: Aspect): FocusItem {
  return {
    kind: "aspect",
    eyebrow: FOCUS_ASPECT_EYEBROW,
    title: `${BODY_NAMES[aspect.a]} — ${BODY_NAMES[aspect.b]}: ${ASPECT_NAMES[aspect.aspect]}`,
    meta: `точность ${formatOrb(aspect.orb)}`,
    text: `${BODY_NAMES[aspect.a]} — ${BODY_KEYWORDS[aspect.a]}; ${BODY_NAMES[aspect.b]} — ${BODY_KEYWORDS[aspect.b]}. ${FOCUS_ASPECT_LINES[aspect.aspect]} ${FOCUS_ORB_NOTE}`,
  };
}

function stelliumItem({ sign, bodies }: { sign: SignId; bodies: BodyId[] }): FocusItem {
  const count = COUNT_WORDS[bodies.length] ?? String(bodies.length);
  const planets = bodies.length < 5 ? "планеты" : "планет";
  return {
    kind: "stellium",
    eyebrow: FOCUS_STELLIUM_EYEBROW,
    title: `${count} ${planets} ${inSign(sign)}`,
    meta: joinNames(bodies.map((body) => BODY_NAMES[body])),
    text: `${FOCUS_STELLIUM_NOTE} Ключевые слова знака: ${SIGN_KEYWORDS[sign]}.`,
  };
}

export function focusItems(chart: NatalChart): FocusItem[] {
  const { aspect, stellium } = findFocus(chart);
  return [...(aspect ? [aspectItem(aspect)] : []), ...(stellium ? [stelliumItem(stellium)] : [])];
}
