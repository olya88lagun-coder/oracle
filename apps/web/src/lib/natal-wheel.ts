import type { AspectId, BodyId, ChartPoint, NatalChart, SignId } from "@oracle/core/natal";
import {
  ANGLE_AXIS_LABELS,
  ANGLE_NAMES,
  BODY_NAMES,
  SIGN_ORDER,
  WHEEL_ARIA_DATA,
  WHEEL_ARIA_DATA_SAMPLE,
  WHEEL_ARIA_NO_ANGLES,
  WHEEL_ARIA_NO_TIME,
  WHEEL_ARIA_NOON,
  WHEEL_ARIA_NOON_SAMPLE,
  WHEEL_ARIA_TITLE,
  WHEEL_HOUSE_NOT_SHOWN,
  WHEEL_NODE_TITLE,
  NOTE_NO_MOON_ASPECTS,
  aspectCountNote,
  formatBirthDate,
  formatDegrees,
  housesCaption,
  inSign,
  sunMoonAscSummary,
  uncertainSignsNote,
} from "./natal-copy";

// Геометрия колеса натальной карты: чистые вычисления, ничего не рисуют. Результат (WheelModel) компонент переводит в SVG
// один к одному: имена полей совпадают с классами и data-атрибутами принятого рисунка (docs/design/mockups/natal/natal-wheel.svg
// и natal-wheel-no-time.svg). Всё в пользовательских единицах viewBox 0 0 720 720 с центром (360, 360).
// Из @oracle/core/natal здесь только типы: колесо получает уже посчитанную карту.

// ---------- Константы: комментарий в шапке принятых SVG и замеры по самим рисункам ----------

export const WHEEL_VIEW_SIZE = 720;
export const WHEEL_CENTRE = 360;

// Шапка SVG: «Radii: outer=306, degree tick inner=298, zodiac inner=263, sign glyph=282, true position marker=252,
// planet glyph=238, radial degree label=185, house outer=143, house inner=112, house number=128, aspect endpoint=108»
export const WHEEL_RADIUS = {
  outer: 306,
  tickInner: 298,
  zodiacInner: 263,
  signGlyph: 282,
  marker: 252,
  planetGlyph: 238,
  degreeLabel: 185,
  houseOuter: 143,
  houseInner: 112,
  houseNumber: 128,
  aspect: 108,
} as const;

// Шапка SVG: «Glyphs: signs=42, bodies=42, retrograde=19»
export const SIGN_GLYPH_SIZE = 42;
export const BODY_GLYPH_SIZE = 42;
export const RETROGRADE_GLYPH_SIZE = 19;

// Замеры по рисунку: засечка идёт от внешнего круга внутрь; через 1° длина 4, через 5° — 8 (до r=298), через 10° — 12 и акцентный цвет
export const TICK_LENGTH = { minor: 4, medium: 8, major: 12 } as const;
export const TICK_EVERY = { medium: 5, major: 10 } as const;

// Продолжение осей AC–DC и IC–MC за кольцо домов: приглушённая линия от r=145 до r=251
export const AXIS_EXTENSION = { inner: 145, outer: 251, opacity: 0.38 } as const;

// Подпись и маркер оси: текст «AC»/«MC» на r=333, кружок на внешнем круге; шапка: «AC/MC=26» — размер шрифта
export const ANGLE_LABEL_RADIUS = 333;
export const ANGLE_NODE_RADIUS = 4.5;

// Выноска от метки истинной позиции (r=252): прямая наружу до r=262; у сдвинутой подписи — с изломом на r=259 и концом у глифа
export const LEADER_STRAIGHT_RADIUS = 262;
export const LEADER_BEND_RADIUS = 259;

// Знак «обратное движение» стоит справа сверху от глифа тела: смещение левого верхнего угла (в экранных единицах, без поворота)
export const RETROGRADE_OFFSET = { x: 33.5, y: -7.5 } as const;

// Предупреждение у тела, чей знак мог смениться: кружок r=8 в правом верхнем углу глифа, внутри «!»
export const WARNING_CIRCLE = { offsetX: BODY_GLYPH_SIZE, offsetY: 0, r: 8 } as const;

// Шапка SVG: «conjunction=circle only (no chord), radius=4.5»; «Orb controls opacity .38-.90»
export const CONJUNCTION_RADIUS = 4.5;
export const ASPECT_OPACITY = { max: 0.9, min: 0.38, perDegree: 0.055 } as const; // 0.90 − 0.055·точность, замерено по 14 хордам образца

// Шапка SVG: «sorted label angular separation >=10 degrees» (общая договорённость, она заменяет 8° из плана)
export const LABEL_SEPARATION = 10;

// Без времени рождения в центре — перекрестие в круге
export const CENTRE_MARK = { r: 24, cross: "M352 360h16M360 352v16" } as const;

// ---------- Типы модели ----------

export type Segment = { x1: number; y1: number; x2: number; y2: number };
export type Box = { x: number; y: number; width: number; height: number };
export type Point2 = { x: number; y: number };

export type WheelCircle = { r: number; outer: boolean };
export type WheelTick = Segment & { major: boolean };
export type WheelSign = Box & { sign: SignId; glyph: string };
export type WheelHouse = {
  house: number; // 1…12
  axis: boolean; // дома 1, 4, 7, 10 — оси: акцентная линия и продолжение
  cusp: number; // долгота куспида
  cuspAttr: string; // значение data-cusp: долгота с одним знаком после запятой
  line: Segment;
  extension: (Segment & { opacity: number }) | null;
  number: { text: string } & Point2;
};
export type WheelAspect = {
  aspect: AspectId;
  bodies: [BodyId, BodyId];
  opacity: number; // 0.38…0.90: чем точнее аспект, тем ярче
  shape: ({ kind: "line" } & Segment) | { kind: "circle"; cx: number; cy: number; r: number }; // соединение — кружок, остальные — хорда
};
export type WheelPoint = {
  id: ChartPoint["id"];
  body: string; // значение data-body: у лунного узла «node»
  glyph: string; // id символа в спрайте: glyph-sun, glyph-node…
  longitude: number;
  labelLongitude: number;
  longitudeAttr: string; // data-longitude
  labelLongitudeAttr: string; // data-label-longitude
  retrograde: boolean;
  house: number | null;
  angle: number; // экранный угол истинной позиции, градусы против часовой от 3 часов
  labelAngle: number; // то же для подписи после разведения
  marker: { cx: number; cy: number; r: number };
  displaced: boolean; // подпись сдвинута с истинной позиции
  leader: Point2[]; // 2 точки (прямая) или 3 (с изломом) — <line> или <path>
  glyphBox: Box;
  retroBox: Box | null;
  degree: { text: string; rotate: number } & Point2; // подпись вдоль радиуса: translate(x y) rotate(rotate)
  title: string;
  warning: { cx: number; cy: number; r: number; mark: string } | null;
};
export type WheelAngleMarker = { label: string; longitude: number; angle: number; text: Point2; node: { cx: number; cy: number; r: number } };
export type WheelModel = {
  timeKnown: boolean; // true — со временем: дома, оси AC и MC; false — Овен слева, без домов
  circles: WheelCircle[];
  ticks: WheelTick[];
  sectors: Segment[];
  signs: WheelSign[];
  houses: WheelHouse[] | null;
  aspects: WheelAspect[];
  points: WheelPoint[];
  angles: { ascendant: WheelAngleMarker; midheaven: WheelAngleMarker } | null;
  centre: { r: number; cross: string } | null;
};

// ---------- Углы ----------

const RAD = Math.PI / 180;
const FULL_TURN = 360;

// Угол в [0, 360); уже подходящее значение возвращается как есть, без арифметики (метки одиночек должны остаться точными)
export function normalizeAngle(value: number): number {
  if (value >= 0 && value < FULL_TURN) return value;
  return ((value % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

// Экранный угол точки с долготой longitude: против часовой стрелки от 3 часов (x = cx + r·cos, y = cy − r·sin).
// Начало отсчёта reference ставится на 9 часов: со временем это асцендент (зодиак идёт против часовой, МС — вверху справа),
// без времени — 0° Овна (reference = 0)
export function wheelAngle(longitude: number, reference: number): number {
  return normalizeAngle(180 + longitude - reference);
}

const circularDistance = (a: number, b: number): number => {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return diff > 180 ? FULL_TURN - diff : diff;
};

function at(radius: number, angle: number): Point2 {
  return { x: WHEEL_CENTRE + radius * Math.cos(angle * RAD), y: WHEEL_CENTRE - radius * Math.sin(angle * RAD) };
}

const segment = (inner: Point2, outer: Point2): Segment => ({ x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y });
const box = (centre: Point2, size: number): Box => ({ x: centre.x - size / 2, y: centre.y - size / 2, width: size, height: size });
const fixed = (value: number) => value.toFixed(3);
const round3 = (value: number) => Math.round(value * 1000) / 1000;
const attrNumber = (value: number) => String(Math.round(value * 100) / 100);

// Подпись вдоль радиуса читается слева направо: в нижней половине колеса её переворачивают на 180°
function upright(angle: number): number {
  const normalized = normalizeAngle(angle);
  const rotate = normalized > 90 && normalized < 270 ? 180 - normalized : -normalized;
  return rotate < -180 ? rotate + FULL_TURN : rotate;
}

// ---------- Разведение подписей ----------

type Member = { index: number; u: number };
type Cluster = { members: Member[]; start: number; step: number };

// Скопление: подписи идут подряд с шагом LABEL_SEPARATION вокруг середины между крайними истинными долготами скопления;
// первая подпись округляется до целого градуса (так получены 272…322 в принятом образце). Одиночка остаётся на своём месте.
function place(members: Member[]): Cluster {
  const first = members[0] as Member;
  const last = members[members.length - 1] as Member;
  if (members.length === 1) return { members, start: first.u, step: 0 };
  const step = Math.min(LABEL_SEPARATION, FULL_TURN / members.length); // шаг меньше 10° — только если точек больше 36
  const centre = (first.u + last.u) / 2;
  return { members, start: Math.round(centre - ((members.length - 1) * step) / 2), step };
}

const endOf = (cluster: Cluster) => cluster.start + (cluster.members.length - 1) * cluster.step;

// Правило разведения (выведено из контракта принятого образца: visual-contract.json › label_longitudes):
// 1. Точки по кругу — это скопления из одной точки. 2. Если зазор между концом скопления и началом следующего (по кругу, через 0/360)
// меньше 10°, скопления сливаются в одно. 3. Скопление раздвигается: подписи с шагом 10° симметрично относительно середины
// между самой западной и самой восточной истинными долготами скопления, начало округляется до целого градуса.
// 4. Раздвинутое скопление могло упереться в соседа — шаги 2–3 повторяются, пока все зазоры не станут не меньше 10°.
// Порядок точек по кругу не меняется, одиночка не двигается, результат не зависит от порядка входа (равные долготы — по номеру).
// Образец: уран 278.99, нептун 284.14, сатурн 292.68, марс 296.83, венера 302.60 → скопление 271…311; узел 315.00 оказывается
// в 4° от венеры, скопление из шести: середина (278.99 + 315.00) / 2 = 296.995 → начало 272 → 272, 282, 292, 302, 312, 322.
export function spreadLabels(longitudes: readonly number[]): number[] {
  if (longitudes.length < 2) return [...longitudes];
  const items: Member[] = longitudes
    .map((value, index) => ({ index, u: normalizeAngle(value) }))
    .sort((a, b) => a.u - b.u || a.index - b.index);
  let clusters: Cluster[] = items.map((item) => place([item]));

  for (let merging = true; merging && clusters.length > 1; ) {
    merging = false;
    for (let i = 0; i < clusters.length; i += 1) {
      const current = clusters[i] as Cluster;
      const wraps = i === clusters.length - 1;
      const next = clusters[wraps ? 0 : i + 1] as Cluster;
      const gap = next.start + (wraps ? FULL_TURN : 0) - endOf(current);
      if (gap >= LABEL_SEPARATION - 1e-9) continue;
      // Слияние через 0/360: хвост списка присоединяет начало, сдвинутое на оборот, и скопление остаётся в конце списка
      const joined = wraps ? [...current.members, ...next.members.map((member) => ({ ...member, u: member.u + FULL_TURN }))] : [...current.members, ...next.members];
      clusters = wraps ? [...clusters.slice(1, i), place(joined)] : [...clusters.slice(0, i), place(joined), ...clusters.slice(i + 2)];
      merging = true;
      break;
    }
  }

  const labels = longitudes.map((value) => value);
  for (const cluster of clusters) {
    cluster.members.forEach((member, position) => {
      labels[member.index] = cluster.members.length === 1 ? member.u : normalizeAngle(cluster.start + position * cluster.step);
    });
  }
  return labels;
}

// ---------- Колесо ----------

type Placement = { point: ChartPoint; angle: number; labelAngle: number; labelLongitude: number };

// Рисуем со временем, только если есть всё нужное: асцендент, МС и дома
function hasAngles(chart: NatalChart): boolean {
  return chart.timeKnown && chart.ascendant !== null && chart.midheaven !== null && chart.houses !== null;
}

const referenceOf = (chart: NatalChart): number => (hasAngles(chart) ? (chart.ascendant?.longitude ?? 0) : 0);

function placePoints(chart: NatalChart): Placement[] {
  const reference = referenceOf(chart);
  const labels = spreadLabels(chart.points.map((point) => point.longitude));
  return chart.points.map((point, index) => {
    const labelLongitude = labels[index] ?? point.longitude;
    return { point, angle: wheelAngle(point.longitude, reference), labelAngle: wheelAngle(labelLongitude, reference), labelLongitude };
  });
}

// Положение тел для подписей и таблицы: экранный угол истинной позиции и угол подписи после разведения
export function wheelPoints(chart: NatalChart): { id: string; angle: number; labelAngle: number }[] {
  return placePoints(chart).map(({ point, angle, labelAngle }) => ({ id: point.id, angle, labelAngle }));
}

function buildCircles(withAngles: boolean): WheelCircle[] {
  const radii: number[] = [WHEEL_RADIUS.outer, WHEEL_RADIUS.tickInner, WHEEL_RADIUS.zodiacInner, WHEEL_RADIUS.marker];
  if (withAngles) radii.push(WHEEL_RADIUS.houseOuter, WHEEL_RADIUS.houseInner);
  return radii.map((r) => ({ r, outer: r === WHEEL_RADIUS.outer }));
}

function buildTicks(reference: number): WheelTick[] {
  return Array.from({ length: FULL_TURN }, (_, longitude) => {
    const major = longitude % TICK_EVERY.major === 0;
    const length = major ? TICK_LENGTH.major : longitude % TICK_EVERY.medium === 0 ? TICK_LENGTH.medium : TICK_LENGTH.minor;
    const angle = wheelAngle(longitude, reference);
    return { ...segment(at(WHEEL_RADIUS.outer, angle), at(WHEEL_RADIUS.outer - length, angle)), major };
  });
}

function buildSectors(reference: number): Segment[] {
  return SIGN_ORDER.map((_, index) => {
    const angle = wheelAngle(index * 30, reference);
    return segment(at(WHEEL_RADIUS.zodiacInner, angle), at(WHEEL_RADIUS.outer, angle));
  });
}

function buildSigns(reference: number): WheelSign[] {
  return SIGN_ORDER.map((sign, index) => ({ sign, glyph: `glyph-${sign}`, ...box(at(WHEEL_RADIUS.signGlyph, wheelAngle(index * 30 + 15, reference)), SIGN_GLYPH_SIZE) }));
}

function buildHouses(cusps: readonly number[], reference: number): WheelHouse[] {
  return cusps.map((cusp, index) => {
    const next = cusps[(index + 1) % cusps.length] ?? cusp;
    const angle = wheelAngle(cusp, reference);
    const middle = wheelAngle(cusp + normalizeAngle(next - cusp) / 2, reference);
    const axis = index % 3 === 0;
    return {
      house: index + 1,
      axis,
      cusp,
      cuspAttr: String(Math.round(cusp * 10) / 10),
      line: segment(at(WHEEL_RADIUS.houseInner, angle), at(WHEEL_RADIUS.houseOuter, angle)),
      extension: axis ? { ...segment(at(AXIS_EXTENSION.inner, angle), at(AXIS_EXTENSION.outer, angle)), opacity: AXIS_EXTENSION.opacity } : null,
      number: { text: String(index + 1), ...at(WHEEL_RADIUS.houseNumber, middle) },
    };
  });
}

const aspectOpacity = (orb: number) => round3(Math.min(ASPECT_OPACITY.max, Math.max(ASPECT_OPACITY.min, ASPECT_OPACITY.max - ASPECT_OPACITY.perDegree * orb)));

function buildAspects(chart: NatalChart, placements: readonly Placement[]): WheelAspect[] {
  const angleOf = (body: BodyId): number => {
    const placement = placements.find((item) => item.point.id === body);
    if (!placement) throw new RangeError(`В карте нет тела ${body}, а аспект с ним есть`);
    return placement.angle;
  };
  return chart.aspects.map((aspect) => {
    const first = angleOf(aspect.a);
    const second = angleOf(aspect.b);
    const opacity = aspectOpacity(aspect.orb);
    const bodies: [BodyId, BodyId] = [aspect.a, aspect.b];
    if (aspect.aspect === "conjunction") {
      // Кружок на середине короткой дуги между телами
      const arc = ((normalizeAngle(second - first) + 180) % FULL_TURN) - 180;
      const middle = at(WHEEL_RADIUS.aspect, first + arc / 2);
      return { aspect: aspect.aspect, bodies, opacity, shape: { kind: "circle", cx: middle.x, cy: middle.y, r: CONJUNCTION_RADIUS } };
    }
    return { aspect: aspect.aspect, bodies, opacity, shape: { kind: "line", ...segment(at(WHEEL_RADIUS.aspect, first), at(WHEEL_RADIUS.aspect, second)) } };
  });
}

function buildPoint(chart: NatalChart, placement: Placement): WheelPoint {
  const { point, angle, labelAngle, labelLongitude } = placement;
  const body = point.id === "northNode" ? "node" : point.id;
  const marker = at(WHEEL_RADIUS.marker, angle);
  const displaced = circularDistance(labelLongitude, point.longitude) > 1e-9;
  const glyphCentre = at(WHEEL_RADIUS.planetGlyph, labelAngle);
  const glyphBox = box(glyphCentre, BODY_GLYPH_SIZE);
  const degreePosition = at(WHEEL_RADIUS.degreeLabel, labelAngle);
  const warns = chart.uncertainSigns.some((uncertain) => uncertain === point.id);
  const warningCentre = { x: glyphBox.x + WARNING_CIRCLE.offsetX, y: glyphBox.y + WARNING_CIRCLE.offsetY };
  const name = point.id === "northNode" ? WHEEL_NODE_TITLE : BODY_NAMES[point.id];

  return {
    id: point.id,
    body,
    glyph: `glyph-${body}`,
    longitude: point.longitude,
    labelLongitude,
    longitudeAttr: attrNumber(point.longitude),
    labelLongitudeAttr: attrNumber(labelLongitude),
    retrograde: point.retrograde,
    house: point.house,
    angle,
    labelAngle,
    marker: { cx: marker.x, cy: marker.y, r: 2.5 },
    displaced,
    leader: displaced ? [marker, at(LEADER_BEND_RADIUS, labelAngle), glyphCentre] : [marker, at(LEADER_STRAIGHT_RADIUS, angle)],
    glyphBox,
    retroBox: point.retrograde ? { x: glyphBox.x + RETROGRADE_OFFSET.x, y: glyphBox.y + RETROGRADE_OFFSET.y, width: RETROGRADE_GLYPH_SIZE, height: RETROGRADE_GLYPH_SIZE } : null,
    degree: { text: formatDegrees(point.degree), rotate: upright(labelAngle), ...degreePosition },
    title: `${name}: ${formatDegrees(point.degree)}, ${point.house === null ? WHEEL_HOUSE_NOT_SHOWN : `дом ${point.house}`}`,
    warning: warns
      ? { cx: warningCentre.x, cy: warningCentre.y, r: WARNING_CIRCLE.r, mark: `M${fixed(warningCentre.x)} ${fixed(warningCentre.y - 4)}v4m0 3v.2` }
      : null,
  };
}

function buildAngleMarker(label: string, longitude: number, reference: number): WheelAngleMarker {
  const angle = wheelAngle(longitude, reference);
  const node = at(WHEEL_RADIUS.outer, angle);
  return { label, longitude, angle, text: at(ANGLE_LABEL_RADIUS, angle), node: { cx: node.x, cy: node.y, r: ANGLE_NODE_RADIUS } };
}

// Модель колеса: окружности, засечки, знаки, дома (со временем), хорды аспектов, планеты с выносками и подписями, оси AC/MC
export function buildWheel(chart: NatalChart): WheelModel {
  const withAngles = hasAngles(chart);
  const reference = referenceOf(chart);
  const placements = placePoints(chart);
  return {
    timeKnown: withAngles,
    circles: buildCircles(withAngles),
    ticks: buildTicks(reference),
    sectors: buildSectors(reference),
    signs: buildSigns(reference),
    houses: withAngles && chart.houses ? buildHouses(chart.houses.cusps, reference) : null,
    aspects: buildAspects(chart, placements),
    points: placements.map((placement) => buildPoint(chart, placement)),
    angles:
      withAngles && chart.ascendant && chart.midheaven
        ? {
            ascendant: buildAngleMarker(ANGLE_AXIS_LABELS.ascendant, chart.ascendant.longitude, reference),
            midheaven: buildAngleMarker(ANGLE_AXIS_LABELS.midheaven, chart.midheaven.longitude, reference),
          }
        : null,
    centre: withAngles ? null : { r: CENTRE_MARK.r, cross: CENTRE_MARK.cross },
  };
}

// ---------- Описание колеса для программ экрана ----------

export type WheelMeta = { city: string; date: string; time: string | null; sample?: boolean };

// Формат — как у aria-label принятых SVG. С вариантом sample: true получается слово в слово строка образца;
// для настоящих данных вместо «образца» стоит «Данные рождения» (и без «образца» в варианте без времени)
export function wheelAriaLabel(chart: NatalChart, meta: WheelMeta): string {
  const sample = meta.sample === true;
  if (!hasAngles(chart) || !chart.ascendant || !chart.houses) {
    const parts = [
      `${WHEEL_ARIA_NO_TIME}: ${sample ? WHEEL_ARIA_NOON_SAMPLE : WHEEL_ARIA_NOON}.`,
      WHEEL_ARIA_NO_ANGLES,
      uncertainSignsNote(chart.uncertainSigns),
      NOTE_NO_MOON_ASPECTS,
      aspectCountNote(chart.aspects.length),
    ];
    return parts.filter((part) => part !== "").join(" ");
  }
  const summary = sunMoonAscSummary(chart);
  const ascendant = `${ANGLE_NAMES.ascendant.toLowerCase()} ${inSign(chart.ascendant.sign)}`;
  const data = `${sample ? WHEEL_ARIA_DATA_SAMPLE : WHEEL_ARIA_DATA}: ${meta.city}, ${formatBirthDate(meta.date)}${meta.time ? `, ${meta.time}` : ""}.`;
  return `${WHEEL_ARIA_TITLE}: ${summary.sun}, ${summary.moon}, ${ascendant}. ${housesCaption(chart.houses.system)}. ${data}`;
}
