import type { Aspect, AspectId, BodyId, HouseSystem, NatalChart, SignId } from "@oracle/core/natal";
import { pluralRu } from "./plural";

// Тексты экрана калькулятора натальной карты дословно из принятого макета docs/design/mockups/natal/natal-calculator.html.
// Из @oracle/core/natal здесь только типы: модуль попадает в бандл страницы, а ядро расчёта грузится после нажатия «Рассчитать карту».

// Заголовок страницы и вводный абзац
export const NATAL_TITLE = "Натальная карта";
export const NATAL_INTRO = "Дата, время и место рождения — и вы увидите, в каких знаках стояли Солнце, Луна и планеты. Это символический язык самопознания, а не предсказание.";

// Форма
export const LABEL_DATE = "Дата рождения";
export const LABEL_TIME = "Время рождения";
export const LABEL_UNKNOWN_TIME = "Время рождения неизвестно";
export const LABEL_CITY = "Место рождения";
export const CITY_PLACEHOLDER = "Начните вводить город";
export const CITY_HINT = "Нет вашего города? Выберите ближайший крупный: часовой пояс и долгота почти не изменятся.";
export const BUTTON_CALCULATE = "Рассчитать карту";
export const BUTTON_CALCULATING = "Считаем карту…";
export const PRIVACY_LINE = "Считается в вашем браузере. Дата, время и место нигде не сохраняются, пока вы сами не нажмёте «Сохранить в портрет».";
export const DISCLAIMER = "Практики — инструмент самопознания, а не предсказание и не консультация.";

// Ошибки полей (те же строки возвращает natal-input.ts)
export const ERROR_DATE_EMPTY = "Укажите дату рождения";
export const ERROR_DATE_RANGE = "Дата должна быть между 1 января 1900 и сегодняшним днём";
export const ERROR_TIME_FORMAT = "Укажите время в формате ЧЧ:ММ";
export const ERROR_CITY_REQUIRED = "Выберите город из списка";

// Список городов
export const CITY_LIST_LABEL = "Города";
export const CITY_LIST_EMPTY = "Такого города не нашлось. Попробуйте другое написание или ближайший крупный город.";
export const CITY_LIST_ERROR = "Не удалось загрузить список городов. Проверьте соединение и попробуйте ещё раз.";

// Уведомления над результатом
export const NOTICE_NO_TIME = "Без времени рождения асцендента, середины неба и домов нет.";
export const NOTICE_AMBIGUOUS = "В это время часы переводили назад: оно было дважды. Выберите, какое ваше.";
export const CHOICE_FIRST = "Первый раз";
export const CHOICE_SECOND = "Второй раз";
export const NOTICE_POLAR = "За полярным кругом асцендент сильно зависит от минуты рождения. Дома считаются по системе Порфирия: Плацидус там не определён.";
export const NOTICE_EARLY = "Для ранних лет история часовых поясов менее надёжна.";
export const NOTE_NO_MOON_ASPECTS = "Аспекты Луны без времени рождения не считаются.";

// Результат
export const RESULT_TITLE = "Ваша натальная карта";
export const POSITIONS_TITLE = "Положения";
export const ASPECTS_TITLE = "Аспекты";
export const KEYS_TITLE = "Что это значит";
export const READ_FULL = "Читать полностью";
export const TEXT_SOON = "Подробный текст скоро появится.";
export const ASCENDANT_NEEDS_TIME = "Асцендент: нужно время рождения";
export const WHEEL_CAPTION_NO_TIME = "Время неизвестно";
export const BIRTH_TIME_UNKNOWN = "время неизвестно";

// Таблица положений
export const TABLE_LABEL = "Положения тел и точек";
export const TABLE_HEAD_BODY = "Тело";
export const TABLE_HEAD_SIGN = "Знак";
export const TABLE_HEAD_DEGREES = "Градусы";
export const TABLE_HEAD_HOUSE = "Дом";
export const TABLE_NO_HOUSE = "—";
export const RETROGRADE_LABEL = "обратное движение";

// Кнопки под результатом
export const ACTION_SAVE = "Сохранить в портрет";
export const ACTION_SHARE = "Поделиться";
export const ACTION_RECALCULATE = "Пересчитать";

// Названия. Ключи — идентификаторы ядра
export const SIGN_NAMES: Readonly<Record<SignId, string>> = {
  aries: "Овен",
  taurus: "Телец",
  gemini: "Близнецы",
  cancer: "Рак",
  leo: "Лев",
  virgo: "Дева",
  libra: "Весы",
  scorpio: "Скорпион",
  sagittarius: "Стрелец",
  capricorn: "Козерог",
  aquarius: "Водолей",
  pisces: "Рыбы",
};

// Знаки по порядку от Овна (порядок ключей SIGN_NAMES зафиксирован тестом)
export const SIGN_ORDER: readonly SignId[] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

// Предложный падеж без предлога («в Овне»); готовую фразу даёт inSign
export const SIGN_NAMES_PREPOSITIONAL: Readonly<Record<SignId, string>> = {
  aries: "Овне",
  taurus: "Тельце",
  gemini: "Близнецах",
  cancer: "Раке",
  leo: "Льве",
  virgo: "Деве",
  libra: "Весах",
  scorpio: "Скорпионе",
  sagittarius: "Стрельце",
  capricorn: "Козероге",
  aquarius: "Водолее",
  pisces: "Рыбах",
};

export const BODY_NAMES: Readonly<Record<BodyId | "northNode", string>> = {
  sun: "Солнце",
  moon: "Луна",
  mercury: "Меркурий",
  venus: "Венера",
  mars: "Марс",
  jupiter: "Юпитер",
  saturn: "Сатурн",
  uranus: "Уран",
  neptune: "Нептун",
  pluto: "Плутон",
  northNode: "Лунный узел (средний)",
};

// Подпись узла в всплывающей подсказке колеса: в принятом SVG там «Восходящий лунный узел», а в таблице — «Лунный узел (средний)»
export const WHEEL_NODE_TITLE = "Восходящий лунный узел";
export const WHEEL_HOUSE_NOT_SHOWN = "дом не показан";

// Описание колеса для программ экрана (aria-label); образец и формулировки взяты из принятых natal-wheel.svg и natal-wheel-no-time.svg
export const WHEEL_ARIA_TITLE = "Колесо натальной карты";
export const WHEEL_ARIA_NO_TIME = "Колесо натальной карты без времени рождения";
export const WHEEL_ARIA_NOON = "планеты на местный полдень";
export const WHEEL_ARIA_NOON_SAMPLE = "планеты образца на местный полдень";
export const WHEEL_ARIA_NO_ANGLES = "Асцендент, MC и дома не показаны.";
export const WHEEL_ARIA_MOON_SIGN = "Знак Луны мог смениться.";
export const WHEEL_ARIA_DATA = "Данные рождения";
export const WHEEL_ARIA_DATA_SAMPLE = "Данные образца";

export const ANGLE_NAMES = { ascendant: "Асцендент", midheaven: "МС" } as const;
// Короткие метки осей: на колесе и перед названием в таблице
export const ANGLE_AXIS_LABELS = { ascendant: "AC", midheaven: "MC" } as const;

export const ASPECT_NAMES: Readonly<Record<AspectId, string>> = {
  conjunction: "соединение",
  sextile: "секстиль",
  square: "квадрат",
  trine: "трин",
  opposition: "оппозиция",
};

// «Солнце сменило, Луна сменила, Меркурий сменил…» — для уведомления о смене знака
export const BODY_PAST_VERBS: Readonly<Record<BodyId, string>> = {
  sun: "сменило",
  moon: "сменила",
  mercury: "сменил",
  venus: "сменила",
  mars: "сменил",
  jupiter: "сменил",
  saturn: "сменил",
  uranus: "сменил",
  neptune: "сменил",
  pluto: "сменил",
};

const HOUSE_SYSTEM_NAMES: Readonly<Record<HouseSystem, string>> = { placidus: "Плацидус", porphyry: "Порфирий" };

const MONTHS_GENITIVE = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"] as const;

const MINUTES_PER_DEGREE = 60;
const MINUTES_IN_SIGN = 30 * MINUTES_PER_DEGREE;
const pad2 = (value: number) => String(value).padStart(2, "0");

// «в Рыбах», «во Льве»: перед «Льве» нужна форма «во»
export function inSign(sign: SignId): string {
  return `${sign === "leo" ? "во" : "в"} ${SIGN_NAMES_PREPOSITIONAL[sign]}`;
}

// Положение внутри знака (0…30°), округлённое до минуты: 16.53 → «16°32′».
// 59,5 минуты и больше переходят в следующий градус (0.9937 → «1°00′»), а у границы знака результат держится на «29°59′»:
// знак выводится отдельно, поэтому «30°00′» или «29°60′» в том же знаке недопустимы.
export function formatDegrees(degree: number): string {
  if (!Number.isFinite(degree)) throw new RangeError("Градусы должны быть конечным числом");
  const total = Math.min(Math.max(Math.round(degree * MINUTES_PER_DEGREE), 0), MINUTES_IN_SIGN - 1);
  return `${Math.floor(total / MINUTES_PER_DEGREE)}°${pad2(total % MINUTES_PER_DEGREE)}′`;
}

// Точность аспекта: 1.1819 → «1°11′» (округление до минуты, перенос в градус)
export function formatOrb(orb: number): string {
  if (!Number.isFinite(orb)) throw new RangeError("Точность аспекта должна быть конечным числом");
  const total = Math.round(Math.abs(orb) * MINUTES_PER_DEGREE);
  return `${Math.floor(total / MINUTES_PER_DEGREE)}°${pad2(total % MINUTES_PER_DEGREE)}′`;
}

export type ChartSummary = { sun: string; moon: string; ascendant: string };

// Три подписи сводки: «Солнце в Рыбах», «Луна в Раке», «Асцендент в Раке» (без времени — «Асцендент: нужно время рождения»)
export function sunMoonAscSummary(chart: NatalChart): ChartSummary {
  const sun = chart.points.find((point) => point.id === "sun");
  const moon = chart.points.find((point) => point.id === "moon");
  if (!sun || !moon) throw new RangeError("В карте нет Солнца или Луны");
  return {
    sun: `${BODY_NAMES.sun} ${inSign(sun.sign)}`,
    moon: `${BODY_NAMES.moon} ${inSign(moon.sign)}`,
    ascendant: chart.timeKnown && chart.ascendant ? `${ANGLE_NAMES.ascendant} ${inSign(chart.ascendant.sign)}` : ASCENDANT_NEEDS_TIME,
  };
}

// «Солнце — Плутон: трин, точность 1°11′»
export function aspectLine(aspect: Aspect): string {
  return `${BODY_NAMES[aspect.a]} — ${BODY_NAMES[aspect.b]}: ${ASPECT_NAMES[aspect.aspect]}, точность ${formatOrb(aspect.orb)}`;
}

// «Дома: Плацидус» / «Дома: Порфирий»
export function housesCaption(system: HouseSystem): string {
  return `Дома: ${HOUSE_SYSTEM_NAMES[system]}`;
}

export function gapNotice(correctedTime: string): string {
  return `В это время часы переводили вперёд: такого времени не было. Считаем по ближайшему существующему — ${correctedTime}.`;
}

export function signChangeNotice(body: BodyId): string {
  return `В этот день ${BODY_NAMES[body]} ${BODY_PAST_VERBS[body]} знак — точный знак зависит от времени рождения.`;
}

// Вторая строка пункта списка городов: «Ростовская область, Россия» (у городов-государств региона нет)
export function formatCityRegion(city: { region: string; country: string }): string {
  return [city.region, city.country].filter((part) => part !== "").join(", ");
}

// «7 марта 1990» из ГГГГ-ММ-ДД
export function formatBirthDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const month = match ? MONTHS_GENITIVE[Number(match[2]) - 1] : undefined;
  if (!match || !month) throw new RangeError("Дата должна быть в формате ГГГГ-ММ-ДД");
  return `${Number(match[3])} ${month} ${Number(match[1])}`;
}

// «Москва · 7 марта 1990 · 12:00»; без времени в принятом макете — «Москва · 7 марта 1990 · время неизвестно»
export function formatBirthMeta(birth: { city: string; date: string; time: string | null }): string {
  return [birth.city, formatBirthDate(birth.date), birth.time ?? BIRTH_TIME_UNKNOWN].join(" · ");
}

// «Знак Луны мог смениться.» или, если знак мог смениться и у других тел, «Знак мог смениться у: Солнце, Луна.»; пустой список — пустая строка
export function uncertainSignsNote(bodies: readonly BodyId[]): string {
  if (bodies.length === 0) return "";
  if (bodies.length === 1 && bodies[0] === "moon") return WHEEL_ARIA_MOON_SIGN;
  return `Знак мог смениться у: ${bodies.map((body) => BODY_NAMES[body]).join(", ")}.`;
}

// «Показано 11 аспектов.», «Показан 1 аспект.», «Показано 2 аспекта.»
export function aspectCountNote(count: number): string {
  const word = pluralRu(count, ["аспект", "аспекта", "аспектов"]);
  const verb = count % 10 === 1 && count % 100 !== 11 ? "Показан" : "Показано";
  return `${verb} ${count} ${word}.`;
}
