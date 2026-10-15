import { describe, expect, test } from "vitest";
import { SIGNS, computeNatalChart, signOf, type Aspect, type ChartPoint, type NatalChart } from "@oracle/core/natal";
import * as copy from "./natal-copy";

// Все строки экрана калькулятора из принятого макета (docs/design/mockups/natal/natal-calculator.html): проверочный список этапа 2
const CALC_STRINGS = [
  "Натальная карта",
  "Дата, время и место рождения — и вы увидите, в каких знаках стояли Солнце, Луна и планеты. Это символический язык самопознания, а не предсказание.",
  "Дата рождения",
  "Время рождения",
  "Время рождения неизвестно",
  "Место рождения",
  "Начните вводить город",
  "Нет вашего города? Выберите ближайший крупный: часовой пояс и долгота почти не изменятся.",
  "Рассчитать карту",
  "Считается в вашем браузере. Дата, время и место нигде не сохраняются, пока вы сами не нажмёте «Сохранить в портрет».",
  "Ваша натальная карта",
  "Положения",
  "Аспекты",
  "Что это значит",
  "Сохранить в портрет",
  "Поделиться",
  "Пересчитать",
  "Практики — инструмент самопознания, а не предсказание и не консультация.",
  "Ростов-на-Дону",
  "Ростовская область, Россия",
  "Ярославская область, Россия",
  "Такого города не нашлось. Попробуйте другое написание или ближайший крупный город.",
  "Не удалось загрузить список городов. Проверьте соединение и попробуйте ещё раз.",
  "Укажите дату рождения",
  "Дата должна быть между 1 января 1900 и сегодняшним днём",
  "Укажите время в формате ЧЧ:ММ",
  "Выберите город из списка",
  "Считаем карту…",
  "Солнце в Рыбах",
  "Луна в Раке",
  "Асцендент в Раке",
  "Асцендент: нужно время рождения",
  "Читать полностью",
  "Подробный текст скоро появится.",
  "Без времени рождения асцендента, середины неба и домов нет.",
  "В этот день Луна сменила знак — точный знак зависит от времени рождения.",
  "Аспекты Луны без времени рождения не считаются.",
  "В это время часы переводили вперёд: такого времени не было. Считаем по ближайшему существующему — 01:30.",
  "В это время часы переводили назад: оно было дважды. Выберите, какое ваше.",
  "Первый раз",
  "Второй раз",
  "За полярным кругом асцендент сильно зависит от минуты рождения. Дома считаются по системе Порфирия: Плацидус там не определён.",
  "Для ранних лет история часовых поясов менее надёжна.",
  "Дома: Плацидус",
  "Дома: Порфирий",
  "Лунный узел (средний)",
  "Солнце — Плутон: трин, точность 1°11′",
];

// Остальные видимые тексты макета, которых нет в проверочном списке
const EXTRA_MOCKUP_STRINGS = [
  "Тело",
  "Знак",
  "Градусы",
  "Дом",
  "обратное движение",
  "Положения тел и точек",
  "Города",
  "Время неизвестно",
  "AC",
  "MC",
  "МС",
  "Асцендент",
  "—",
  "Москва · 7 марта 1990 · 12:00",
  "Москва · 7 марта 1990 · время неизвестно",
];

// Названия городов в списке — данные из базы, а не тексты; регион и страну собирает formatCityRegion
const CITY_NAMES_FROM_DATA = new Set(["Ростов-на-Дону"]);

function collectStrings(value: unknown, into: Set<string>): void {
  if (typeof value === "string") into.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, into));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, into));
}

const point = (id: ChartPoint["id"], longitude: number, retrograde = false): ChartPoint => {
  const { sign, degree } = signOf(longitude);
  return { id, longitude, sign, degree, retrograde, house: null };
};
const makeChart = (overrides: Partial<NatalChart> = {}): NatalChart => ({
  points: [point("sun", 346.53), point("moon", 118.12)],
  ascendant: { longitude: 104.13, ...signOf(104.13) },
  midheaven: { longitude: 335.64, ...signOf(335.64) },
  houses: null,
  aspects: [],
  uncertainSigns: [],
  timeKnown: true,
  ...overrides,
});

describe("natal copy: every mockup string is reachable from natal-copy.ts", () => {
  const corpus = new Set<string>();
  collectStrings(copy, corpus);
  // Строки, которые модуль собирает функциями, — на тех же примерах, что в макете
  collectStrings(copy.sunMoonAscSummary(makeChart()), corpus);
  collectStrings(copy.sunMoonAscSummary(makeChart({ ascendant: null, midheaven: null, timeKnown: false })), corpus);
  collectStrings(copy.signChangeNotice("moon"), corpus);
  collectStrings(copy.gapNotice("01:30"), corpus);
  collectStrings([copy.housesCaption("placidus"), copy.housesCaption("porphyry")], corpus);
  collectStrings(copy.aspectLine({ a: "sun", b: "pluto", aspect: "trine", orb: 1.1819 }), corpus);
  collectStrings(copy.formatCityRegion({ region: "Ростовская область", country: "Россия" }), corpus);
  collectStrings(copy.formatCityRegion({ region: "Ярославская область", country: "Россия" }), corpus);
  collectStrings(copy.formatBirthMeta({ city: "Москва", date: "1990-03-07", time: "12:00" }), corpus);
  collectStrings(copy.formatBirthMeta({ city: "Москва", date: "1990-03-07", time: null }), corpus);

  test.each(CALC_STRINGS.filter((text) => !CITY_NAMES_FROM_DATA.has(text)))("%s", (text) => {
    expect(corpus.has(text)).toBe(true);
  });

  test.each(EXTRA_MOCKUP_STRINGS)("extra: %s", (text) => {
    expect(corpus.has(text)).toBe(true);
  });

  test("the checked list has all 47 strings of the stage-2 script", () => {
    expect(CALC_STRINGS).toHaveLength(47);
  });
});

describe("name tables", () => {
  test("SIGN_ORDER is the core zodiac order", () => {
    expect(copy.SIGN_ORDER).toEqual(SIGNS);
  });

  test("signs: nominative and prepositional forms in zodiac order", () => {
    expect(Object.keys(copy.SIGN_NAMES)).toEqual(["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"]);
    expect(Object.values(copy.SIGN_NAMES)).toEqual(["Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева", "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"]);
    expect(Object.values(copy.SIGN_NAMES_PREPOSITIONAL)).toEqual(["Овне", "Тельце", "Близнецах", "Раке", "Льве", "Деве", "Весах", "Скорпионе", "Стрельце", "Козероге", "Водолее", "Рыбах"]);
  });

  test("the locative phrase takes «во» only before «Льве»", () => {
    expect(copy.inSign("pisces")).toBe("в Рыбах");
    expect(copy.inSign("aquarius")).toBe("в Водолее");
    expect(copy.inSign("leo")).toBe("во Льве");
  });

  test("bodies, node, angles and aspects", () => {
    expect(copy.BODY_NAMES).toEqual({
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
    });
    expect(copy.ANGLE_NAMES).toEqual({ ascendant: "Асцендент", midheaven: "МС" });
    expect(copy.ASPECT_NAMES).toEqual({ conjunction: "соединение", sextile: "секстиль", square: "квадрат", trine: "трин", opposition: "оппозиция" });
  });

  test("past-tense verbs agree with the body gender", () => {
    expect(copy.BODY_PAST_VERBS).toEqual({
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
    });
  });

  test("the sign-change notice follows the template; for the Moon it is the mockup sentence", () => {
    expect(copy.signChangeNotice("moon")).toBe("В этот день Луна сменила знак — точный знак зависит от времени рождения.");
    expect(copy.signChangeNotice("sun")).toBe("В этот день Солнце сменило знак — точный знак зависит от времени рождения.");
    expect(copy.signChangeNotice("mercury")).toBe("В этот день Меркурий сменил знак — точный знак зависит от времени рождения.");
  });
});

describe("formatDegrees", () => {
  test("rounds to the nearest minute and pads minutes to two digits", () => {
    expect(copy.formatDegrees(16.53)).toBe("16°32′");
    expect(copy.formatDegrees(28.12)).toBe("28°07′");
    expect(copy.formatDegrees(0)).toBe("0°00′");
    expect(copy.formatDegrees(5.64)).toBe("5°38′");
  });

  test("59.5 minutes and more carry into the next degree", () => {
    expect(copy.formatDegrees(16.99999)).toBe("17°00′");
    expect(copy.formatDegrees(0.99373)).toBe("1°00′");
    expect(copy.formatDegrees(9.9999)).toBe("10°00′");
  });

  test("never prints 60 minutes or the 30th degree inside a sign", () => {
    for (const degree of [29.99, 29.9917, 29.9983, 29.99999, 29.999999999, 30]) {
      expect(copy.formatDegrees(degree)).toBe("29°59′");
    }
  });

  test("minutes are always two digits and below 60 over the whole range", () => {
    for (let hundredths = 0; hundredths <= 3000; hundredths += 1) {
      expect(copy.formatDegrees(hundredths / 100)).toMatch(/^(?:[0-9]|[12][0-9])°[0-5][0-9]′$/);
    }
  });

  test("rejects a non-finite value", () => {
    expect(() => copy.formatDegrees(Number.NaN)).toThrow(RangeError);
  });
});

describe("formatOrb", () => {
  test("degrees and minutes of the orb", () => {
    expect(copy.formatOrb(1.1819)).toBe("1°11′");
    expect(copy.formatOrb(4.1521)).toBe("4°09′");
    expect(copy.formatOrb(0)).toBe("0°00′");
    expect(copy.formatOrb(7.5)).toBe("7°30′");
  });

  test("carries 59.5+ minutes to the next degree", () => {
    expect(copy.formatOrb(1.99999)).toBe("2°00′");
    expect(copy.formatOrb(5.9999)).toBe("6°00′");
  });
});

describe("summary and lines", () => {
  test("Sun, Moon and Ascendant labels with time", () => {
    expect(copy.sunMoonAscSummary(makeChart())).toEqual({ sun: "Солнце в Рыбах", moon: "Луна в Раке", ascendant: "Асцендент в Раке" });
  });

  test("without time the Ascendant label asks for the birth time", () => {
    const chart = makeChart({ ascendant: null, midheaven: null, timeKnown: false });
    expect(copy.sunMoonAscSummary(chart).ascendant).toBe("Асцендент: нужно время рождения");
  });

  test("a chart without the Sun or the Moon is a programming error", () => {
    expect(() => copy.sunMoonAscSummary(makeChart({ points: [] }))).toThrow(RangeError);
  });

  test("aspect line format", () => {
    const aspect: Aspect = { a: "sun", b: "pluto", aspect: "trine", orb: 1.1819 };
    expect(copy.aspectLine(aspect)).toBe("Солнце — Плутон: трин, точность 1°11′");
  });

  test("gap notice carries the corrected time", () => {
    expect(copy.gapNotice("01:30")).toBe("В это время часы переводили вперёд: такого времени не было. Считаем по ближайшему существующему — 01:30.");
  });

  test("houses caption by system", () => {
    expect(copy.housesCaption("placidus")).toBe("Дома: Плацидус");
    expect(copy.housesCaption("porphyry")).toBe("Дома: Порфирий");
  });

  test("city region line skips an empty region", () => {
    expect(copy.formatCityRegion({ region: "Ростовская область", country: "Россия" })).toBe("Ростовская область, Россия");
    expect(copy.formatCityRegion({ region: "", country: "Сингапур" })).toBe("Сингапур");
  });

  test("birth meta line: city, date in genitive, time", () => {
    expect(copy.formatBirthMeta({ city: "Москва", date: "1990-03-07", time: "12:00" })).toBe("Москва · 7 марта 1990 · 12:00");
    expect(copy.formatBirthMeta({ city: "Омск", date: "2001-12-31", time: "00:05" })).toBe("Омск · 31 декабря 2001 · 00:05");
    expect(copy.formatBirthMeta({ city: "Москва", date: "1990-03-07", time: null })).toBe("Москва · 7 марта 1990 · время неизвестно");
  });

  test("birth meta rejects a malformed date", () => {
    expect(() => copy.formatBirthMeta({ city: "Москва", date: "07.03.1990", time: null })).toThrow(RangeError);
  });
});

describe("against the real core output for Moscow, 7 March 1990 12:00", () => {
  const chart = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown: true });

  test("degrees of every body and of the angles equal the accepted mockup table", () => {
    const expected: Record<string, string> = {
      sun: "16°32′",
      moon: "28°07′",
      mercury: "6°19′",
      venus: "2°36′",
      mars: "26°50′",
      jupiter: "1°00′",
      saturn: "22°41′",
      uranus: "8°59′",
      neptune: "14°08′",
      pluto: "17°43′",
      northNode: "15°00′",
    };
    for (const body of chart.points) expect(copy.formatDegrees(body.degree), body.id).toBe(expected[body.id]);
    expect(copy.formatDegrees(chart.ascendant?.degree ?? Number.NaN)).toBe("14°08′");
    expect(copy.formatDegrees(chart.midheaven?.degree ?? Number.NaN)).toBe("5°38′");
  });

  test("summary and all 14 aspect lines equal the mockup", () => {
    expect(copy.sunMoonAscSummary(chart)).toEqual({ sun: "Солнце в Рыбах", moon: "Луна в Раке", ascendant: "Асцендент в Раке" });
    expect(chart.aspects.map(copy.aspectLine)).toEqual([
      "Солнце — Плутон: трин, точность 1°11′",
      "Луна — Марс: оппозиция, точность 1°17′",
      "Солнце — Нептун: секстиль, точность 2°24′",
      "Меркурий — Уран: секстиль, точность 2°41′",
      "Нептун — Плутон: секстиль, точность 3°35′",
      "Марс — Сатурн: соединение, точность 4°09′",
      "Луна — Венера: оппозиция, точность 4°29′",
      "Сатурн — Плутон: секстиль, точность 4°58′",
      "Уран — Нептун: соединение, точность 5°09′",
      "Меркурий — Юпитер: трин, точность 5°19′",
      "Луна — Сатурн: оппозиция, точность 5°26′",
      "Венера — Марс: соединение, точность 5°46′",
      "Солнце — Сатурн: секстиль, точность 6°09′",
      "Солнце — Уран: секстиль, точность 7°32′",
    ]);
  });
});
