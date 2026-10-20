import type { BodyId, ChartPoint, NatalChart, SignId } from "@oracle/core/natal";
import {
  ANGLE_NAMES,
  ASPECT_NAMES,
  BODY_NAMES,
  NOTE_NO_MOON_ASPECTS,
  SIGN_NAMES,
  SIGN_NAMES_PREPOSITIONAL,
  SIGN_ORDER,
  formatDegrees,
  inSign,
  signChangeNotice,
} from "./natal-copy";
import { NATAL_KEY_TEXTS, keyTextFor, type NatalKeyRegistry } from "./natal-texts";
import { ANGLE_LABEL_RADIUS, WHEEL_CENTRE, WHEEL_RADIUS, normalizeAngle, referenceOf, ringSector, wheelAngle, type WheelModel } from "./natal-wheel";

// Интерактивное колесо: что показывает карточка при выборе планеты, знака, дома или оси, какой элемент колеса лежит под курсором
// и как меняется выбор от наведения и нажатия. Всё — чистые функции: компоненты только вызывают их. Тексты — короткие ключевые слова
// на простом языке, без обещаний и предсказаний; подробный текст лежит на странице значения, ссылка на неё есть, когда страница открыта.

export type AngleId = "ascendant" | "midheaven";
export type WheelSelection =
  | { kind: "body"; id: ChartPoint["id"] }
  | { kind: "angle"; id: AngleId }
  | { kind: "sign"; sign: SignId }
  | { kind: "house"; house: number };

export const selectionKey = (selection: WheelSelection): string => {
  switch (selection.kind) {
    case "body":
    case "angle":
      return `${selection.kind}:${selection.id}`;
    case "sign":
      return `sign:${selection.sign}`;
    case "house":
      return `house:${selection.house}`;
  }
};

// ---------- Тексты ----------

export const WHEEL_CARD_HINT = "Нажмите на планету, знак или дом — здесь появится пояснение.";
export const WHEEL_PICKER_LABEL = "Выбрать точку на колесе";
export const WHEEL_CARD_LABEL = "Пояснение к колесу";

export const BODY_KEYWORDS: Readonly<Record<BodyId | "northNode", string>> = {
  sun: "сознание и воля",
  moon: "чувства и потребности",
  mercury: "мышление и речь",
  venus: "любовь и ценности",
  mars: "энергия и действие",
  jupiter: "рост и поиск смысла",
  saturn: "структура и границы",
  uranus: "перемены и независимость",
  neptune: "воображение и интуиция",
  pluto: "глубина и преобразование",
  northNode: "направление, к которому тянет развиваться",
};

export const SIGN_KEYWORDS: Readonly<Record<SignId, string>> = {
  aries: "инициатива, прямота, энергия",
  taurus: "устойчивость, чувственность, терпение",
  gemini: "любопытство, общение, подвижность",
  cancer: "забота, чувствительность, память",
  leo: "самовыражение, щедрость, тепло",
  virgo: "внимание к деталям, польза, порядок",
  libra: "гармония, партнёрство, баланс",
  scorpio: "глубина, интенсивность, проницательность",
  sagittarius: "поиск смысла, свобода, оптимизм",
  capricorn: "дисциплина, цели, ответственность",
  aquarius: "независимость, идеи, общность",
  pisces: "воображение, сочувствие, интуиция",
};

export const HOUSE_KEYWORDS: Readonly<Record<number, string>> = {
  1: "самоощущение и первое впечатление",
  2: "ресурсы, деньги, ценности",
  3: "общение, учёба, ближнее окружение",
  4: "дом, семья, корни",
  5: "творчество, увлечения, романтика",
  6: "повседневность, работа, здоровье",
  7: "партнёрство и близкие отношения",
  8: "глубокая близость, общие ресурсы, перемены",
  9: "смыслы, обучение, дальние поездки",
  10: "призвание, цели, общественная роль",
  11: "друзья, сообщества, планы",
  12: "уединение, внутренний мир, отдых",
};

export const ANGLE_KEYWORDS: Readonly<Record<AngleId, string>> = {
  ascendant: "первое впечатление и манера входить в новое",
  midheaven: "направление в делах и публичная роль",
};

const STELLIUM_NOTE = "Три планеты и больше в одном знаке астрологи называют стеллиумом: тема знака в карте заметнее.";
const MEANING_LINK_LABEL = "Значение";
// Страница значения называется «Северный узел в Овне», а в таблице и на колесе точка — «Лунный узел (средний)»
const NODE_PAGE_NAME = "Северный узел";
const NO_ASPECTS = "главных аспектов нет";
const NOBODY = "никого нет";

// ---------- Карточка ----------

export type CardRow = { label: string; text: string };
export type WheelCard = { title: string; rows: CardRow[]; link: { href: string; label: string } | null; note: string | null };

const STELLIUM_MINIMUM = 3;

export const signOfLongitude = (longitude: number): SignId => SIGN_ORDER[Math.floor(normalizeAngle(longitude) / 30)] ?? "aries";
const bodyName = (id: ChartPoint["id"]): string => BODY_NAMES[id];
const namesOf = (points: readonly ChartPoint[]): string => (points.length === 0 ? NOBODY : points.map((point) => bodyName(point.id)).join(", "));
const joinNotes = (notes: readonly (string | false)[]): string | null => {
  const filled = notes.filter((note): note is string => note !== false && note !== "");
  return filled.length === 0 ? null : filled.join(" ");
};

function bodyAspectsText(chart: NatalChart, id: ChartPoint["id"]): string {
  const own = chart.aspects
    .filter((aspect) => aspect.a === id || aspect.b === id)
    .sort((first, second) => first.orb - second.orb)
    .map((aspect) => `${BODY_NAMES[aspect.a === id ? aspect.b : aspect.a]} (${ASPECT_NAMES[aspect.aspect]})`);
  return own.length === 0 ? NO_ASPECTS : own.join(", ");
}

function describeBody(chart: NatalChart, id: ChartPoint["id"], registry: NatalKeyRegistry): WheelCard | null {
  const point = chart.points.find((item) => item.id === id);
  if (!point) return null;
  const house = chart.timeKnown && point.house !== null ? point.house : null;
  const published = keyTextFor(id, point.sign, registry);
  const rows: CardRow[] = [
    { label: id === "northNode" ? "Точка" : "Планета", text: BODY_KEYWORDS[id] },
    { label: "Знак", text: `${SIGN_NAMES[point.sign]}: ${SIGN_KEYWORDS[point.sign]}` },
  ];
  if (house !== null) rows.push({ label: "Дом", text: `${house}: ${HOUSE_KEYWORDS[house] ?? ""}` });
  if (id !== "northNode") rows.push({ label: "Аспекты", text: bodyAspectsText(chart, id) });
  return {
    title: [`${bodyName(id)} ${inSign(point.sign)}`, formatDegrees(point.degree), house === null ? "" : `${house} дом`].filter((part) => part !== "").join(" · "),
    rows,
    link: published ? { href: published.href, label: `${MEANING_LINK_LABEL}: ${id === "northNode" ? NODE_PAGE_NAME : bodyName(id)} ${inSign(point.sign)}` } : null,
    note: joinNotes([id !== "northNode" && chart.uncertainSigns.includes(id) && signChangeNotice(id), id === "moon" && !chart.timeKnown && NOTE_NO_MOON_ASPECTS]),
  };
}

function describeAngle(chart: NatalChart, id: AngleId, registry: NatalKeyRegistry): WheelCard | null {
  const angle = id === "ascendant" ? chart.ascendant : chart.midheaven;
  if (!chart.timeKnown || !angle) return null;
  const published = id === "ascendant" ? keyTextFor("ascendant", angle.sign, registry) : null;
  return {
    title: `${ANGLE_NAMES[id]} ${inSign(angle.sign)} · ${formatDegrees(angle.degree)}`,
    rows: [
      { label: "Ось", text: ANGLE_KEYWORDS[id] },
      { label: "Знак", text: `${SIGN_NAMES[angle.sign]}: ${SIGN_KEYWORDS[angle.sign]}` },
    ],
    link: published ? { href: published.href, label: `${MEANING_LINK_LABEL}: ${ANGLE_NAMES[id]} ${inSign(angle.sign)}` } : null,
    note: null,
  };
}

function describeSign(chart: NatalChart, sign: SignId): WheelCard {
  const inside = chart.points.filter((point) => point.sign === sign);
  const planets = inside.filter((point) => point.id !== "northNode");
  return {
    title: SIGN_NAMES[sign],
    rows: [
      { label: "Знак", text: SIGN_KEYWORDS[sign] },
      { label: "Планеты в знаке", text: namesOf(inside) },
    ],
    link: null,
    note: planets.length >= STELLIUM_MINIMUM ? STELLIUM_NOTE : null,
  };
}

function describeHouse(chart: NatalChart, house: number): WheelCard | null {
  const cusp = chart.timeKnown ? chart.houses?.cusps[house - 1] : undefined;
  if (cusp === undefined) return null;
  return {
    title: `${house} дом в ${SIGN_NAMES_PREPOSITIONAL[signOfLongitude(cusp)]}`,
    rows: [
      { label: "Дом", text: HOUSE_KEYWORDS[house] ?? "" },
      { label: "Планеты в доме", text: namesOf(chart.points.filter((point) => point.house === house)) },
    ],
    link: null,
    note: null,
  };
}

export function describeSelection(chart: NatalChart, selection: WheelSelection, registry: NatalKeyRegistry = NATAL_KEY_TEXTS): WheelCard | null {
  switch (selection.kind) {
    case "body":
      return describeBody(chart, selection.id, registry);
    case "angle":
      return describeAngle(chart, selection.id, registry);
    case "sign":
      return describeSign(chart, selection.sign);
    case "house":
      return describeHouse(chart, selection.house);
  }
}

// Тела, которые подсвечиваются вместе с выбранным: у планеты — она сама и её партнёры по аспектам, у знака и дома — стоящие в них
export function relatedBodies(chart: NatalChart, selection: WheelSelection): Set<ChartPoint["id"]> {
  switch (selection.kind) {
    case "body": {
      const related = new Set<ChartPoint["id"]>([selection.id]);
      for (const aspect of chart.aspects) {
        if (aspect.a === selection.id) related.add(aspect.b);
        if (aspect.b === selection.id) related.add(aspect.a);
      }
      return related;
    }
    case "sign":
      return new Set(chart.points.filter((point) => point.sign === selection.sign).map((point) => point.id));
    case "house":
      return new Set(chart.points.filter((point) => point.house === selection.house).map((point) => point.id));
    case "angle":
      return new Set();
  }
}

// Подсветка выбранного знака (кольцо знаков) или дома (кольцо домов): путь для <path>; у планет и осей подсвечиваются сами элементы
export function selectionArc(chart: NatalChart, selection: WheelSelection): string | null {
  const reference = referenceOf(chart);
  if (selection.kind === "sign") return ringSector(WHEEL_RADIUS.zodiacInner, WHEEL_RADIUS.outer, wheelAngle(SIGN_ORDER.indexOf(selection.sign) * 30, reference), 30);
  if (selection.kind !== "house" || !chart.timeKnown) return null;
  const cusps = chart.houses?.cusps;
  const cusp = cusps?.[selection.house - 1];
  const next = cusps?.[selection.house % 12];
  if (cusp === undefined || next === undefined) return null;
  return ringSector(WHEEL_RADIUS.houseInner, WHEEL_RADIUS.houseOuter, wheelAngle(cusp, reference), normalizeAngle(next - cusp));
}

// ---------- Что лежит под курсором ----------

// Радиусы попадания в единицах viewBox: глиф тела 42, подпись оси мельче; запас нужен, чтобы попасть пальцем
const BODY_HIT_RADIUS = 26;
const ANGLE_HIT_RADIUS = 22;
const DEGREES = 180 / Math.PI;

function houseAt(chart: NatalChart, longitude: number): number | null {
  const cusps = chart.houses?.cusps;
  if (!chart.timeKnown || !cusps) return null;
  const index = cusps.findIndex((cusp, position) => normalizeAngle(longitude - cusp) < normalizeAngle((cusps[(position + 1) % cusps.length] ?? cusp) - cusp));
  return index === -1 ? null : index + 1;
}

export function hitTest(model: WheelModel, chart: NatalChart, x: number, y: number): WheelSelection | null {
  const nearest = model.points
    .map((point) => ({ id: point.id, distance: Math.hypot(point.glyphBox.x + point.glyphBox.width / 2 - x, point.glyphBox.y + point.glyphBox.height / 2 - y) }))
    .filter((item) => item.distance <= BODY_HIT_RADIUS)
    .sort((first, second) => first.distance - second.distance)[0];
  if (nearest) return { kind: "body", id: nearest.id };

  if (model.angles) {
    for (const [id, marker] of [["ascendant", model.angles.ascendant], ["midheaven", model.angles.midheaven]] as const) {
      if (Math.hypot(marker.text.x - x, marker.text.y - y) <= ANGLE_HIT_RADIUS) return { kind: "angle", id };
    }
  }

  const radius = Math.hypot(x - WHEEL_CENTRE, y - WHEEL_CENTRE);
  if (radius > ANGLE_LABEL_RADIUS) return null;
  const screenAngle = normalizeAngle(Math.atan2(WHEEL_CENTRE - y, x - WHEEL_CENTRE) * DEGREES);
  const longitude = normalizeAngle(screenAngle - 180 + referenceOf(chart));
  if (radius >= WHEEL_RADIUS.zodiacInner && radius <= WHEEL_RADIUS.outer) return { kind: "sign", sign: signOfLongitude(longitude) };
  if (model.houses && radius >= WHEEL_RADIUS.houseInner && radius <= WHEEL_RADIUS.houseOuter) {
    const house = houseAt(chart, longitude);
    return house === null ? null : { kind: "house", house };
  }
  return null;
}

// ---------- Выбор: наведение и нажатие ----------

export type WheelState = { pinned: WheelSelection | null; hover: WheelSelection | null };
export type WheelEvent = { type: "hover"; target: WheelSelection | null } | { type: "tap"; target: WheelSelection | null } | { type: "clear" };

export const initialWheelState: WheelState = { pinned: null, hover: null };

// Показывается то, на что наведён курсор, иначе закреплённое нажатием
export const shownSelection = (state: WheelState): WheelSelection | null => state.hover ?? state.pinned;

export function wheelReducer(state: WheelState, event: WheelEvent): WheelState {
  switch (event.type) {
    case "hover": {
      // Мышь шлёт события на каждый пиксель: тот же элемент не создаёт нового состояния и не вызывает перерисовку
      const same = event.target && state.hover ? selectionKey(event.target) === selectionKey(state.hover) : event.target === state.hover;
      return same ? state : { ...state, hover: event.target };
    }
    case "tap":
      if (event.target === null) return initialWheelState;
      return { pinned: state.pinned && selectionKey(state.pinned) === selectionKey(event.target) ? null : event.target, hover: null };
    case "clear":
      return initialWheelState;
  }
}
