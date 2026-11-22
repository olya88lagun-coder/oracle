import { lunarDayText, phaseText, type LunarDayText, type PhaseText } from "@oracle/content/moon";
import { NATAL_KEY_SUMMARIES } from "@oracle/content/natal-keys";
import { dayStart, lunarDay, MOSCOW, moonRises, moonSets, moonSnapshot, nextMoonEvent, type MoonEvent, type MoonSnapshot, type PhaseId, type Place } from "@oracle/core/moon";
import type { SignId } from "@oracle/core/natal";
import { MOON_PATH } from "./moon-paths";
import { NATAL_PATH, natalPagePath } from "./natal-paths";
import { TARO_DAY_PATH } from "./taro-paths";

export { MOON_PATH };

export const PHASE_NAMES: Record<PhaseId, string> = {
  new: "Новолуние",
  waxingCrescent: "Растущий серп",
  firstQuarter: "Первая четверть",
  waxingGibbous: "Растущая Луна",
  full: "Полнолуние",
  waningGibbous: "Убывающая Луна",
  lastQuarter: "Последняя четверть",
  waningCrescent: "Убывающий серп",
};

export const SIGN_NAMES_LOCATIVE: Record<SignId, string> = {
  aries: "в Овне",
  taurus: "в Тельце",
  gemini: "в Близнецах",
  cancer: "в Раке",
  leo: "во Льве",
  virgo: "в Деве",
  libra: "в Весах",
  scorpio: "в Скорпионе",
  sagittarius: "в Стрельце",
  capricorn: "в Козероге",
  aquarius: "в Водолее",
  pisces: "в Рыбах",
};

const EVENT_NAMES: Record<MoonEvent["kind"], string> = { new: "Новолуние", firstQuarter: "Первая четверть", full: "Полнолуние", lastQuarter: "Последняя четверть" };

const DAY_MS = 86_400_000;

// Форматтеры по часовому поясу места: создаются один раз на зону (по умолчанию Europe/Moscow)
type Formats = { time: Intl.DateTimeFormat; longDate: Intl.DateTimeFormat; dayMonth: Intl.DateTimeFormat; shortDate: Intl.DateTimeFormat; isoDate: Intl.DateTimeFormat };
const formatCache = new Map<string, Formats>();
function formatsFor(zone: string): Formats {
  let formats = formatCache.get(zone);
  if (!formats) {
    const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ru-RU", { timeZone: zone, ...options });
    formats = {
      time: format({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
      longDate: format({ day: "numeric", month: "long", year: "numeric" }),
      dayMonth: format({ day: "numeric", month: "long" }),
      shortDate: format({ day: "numeric", month: "short" }),
      isoDate: new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }),
    };
    formatCache.set(zone, formats);
  }
  return formats;
}

// «сегодня в 14:48», «завтра в 05:10», «24 ноября, 17:53»: день по часовому поясу места (по умолчанию Москва), а не сервера
function whenLabel(date: Date, now: Date, place: Place): string {
  const formats = formatsFor(place.zone);
  const clock = formats.time.format(date);
  const difference = Math.round((dayStart(date, place).getTime() - dayStart(now, place).getTime()) / DAY_MS);
  if (difference === 0) return `сегодня в ${clock}`;
  if (difference === 1) return `завтра в ${clock}`;
  if (difference === -1) return `вчера в ${clock}`;
  return `${formats.dayMonth.format(date)}, ${clock}`;
}

export type MoonDayCell = { date: string; label: string; isToday: boolean; snapshot: MoonSnapshot };

export type MoonToday = {
  dateLabel: string;
  snapshot: MoonSnapshot;
  phaseName: string;
  signName: string;
  signSummary: { text: string; href: string } | null;
  lunarDay: { number: number; startsLabel: string; endsLabel: string };
  rise: string | null;
  set: string | null;
  next: { kind: MoonEvent["kind"]; label: string };
  strip: MoonDayCell[];
  texts: { phase: PhaseText | null; day: LunarDayText | null };
  links: { cardOfDay: string; natal: string };
};

const STRIP_DAYS = 14;

// Всё считается для момента `now` по месту (по умолчанию Москва); страница обновляется раз в час, поэтому подписи «сегодня» могут отставать не больше чем на час
export function buildMoonToday(now: Date, place: Place = MOSCOW): MoonToday {
  const formats = formatsFor(place.zone);
  const start = dayStart(now, place);
  const snapshot = moonSnapshot(now);
  const day = lunarDay(now, place);
  const nextEvent = nextMoonEvent(now);
  const summary = NATAL_KEY_SUMMARIES[`moon-${snapshot.sign}`];
  const rise = moonRises(start, 1, place)[0];
  const set = moonSets(start, 1, place)[0];
  // Начала местных суток: 30 часов от начала попадают внутрь следующих суток при любом переводе часов
  const starts = [start];
  for (let index = 1; index <= STRIP_DAYS; index++) starts.push(dayStart(new Date(starts[index - 1]!.getTime() + 30 * 3_600_000), place));
  return {
    dateLabel: formats.longDate.format(now).replace(/\s*г\.$/, ""),
    snapshot,
    phaseName: PHASE_NAMES[snapshot.phase],
    signName: SIGN_NAMES_LOCATIVE[snapshot.sign],
    signSummary: summary ? { text: summary.summary, href: natalPagePath({ slug: summary.slug }) } : null,
    lunarDay: { number: day.number, startsLabel: whenLabel(day.startsAt, now, place), endsLabel: whenLabel(day.endsAt, now, place) },
    rise: rise ? formats.time.format(rise) : null,
    set: set ? formats.time.format(set) : null,
    next: { kind: nextEvent.kind, label: `${EVENT_NAMES[nextEvent.kind]} ${whenLabel(nextEvent.at, now, place)}` },
    strip: Array.from({ length: STRIP_DAYS }, (_, index) => {
      // «Полдень» суток — середина между началами местных суток (в сутки перевода часов это не +12 часов)
      const noon = new Date(starts[index]!.getTime() + (starts[index + 1]!.getTime() - starts[index]!.getTime()) / 2);
      return { date: formats.isoDate.format(noon), label: formats.shortDate.format(noon).replace(/\.$/, ""), isToday: index === 0, snapshot: moonSnapshot(noon) };
    }),
    texts: { phase: phaseText(snapshot.phase) ?? null, day: lunarDayText(day.number) ?? null },
    links: { cardOfDay: TARO_DAY_PATH, natal: NATAL_PATH },
  };
}

export const MOON_FAQ: readonly { question: string; answer: string }[] = [
  {
    question: "Что такое лунные сутки?",
    answer: "Лунные сутки — это промежуток между двумя восходами Луны, примерно 24 часа 50 минут. В российских лунных календарях первые сутки начинаются в момент новолуния, вторые — с первого восхода Луны после него, и так до тридцатых. Номер суток описывает положение в лунном месяце и не зависит от даты в обычном календаре.",
  },
  {
    question: "Чем лунные сутки отличаются от фазы Луны?",
    answer: "Фаза показывает, какая часть диска освещена Солнцем: новолуние, четверти, полнолуние. Лунные сутки считают по времени от новолуния и по восходам Луны. Фаза меняется плавно и одинакова для всех на Земле, а границы лунных суток зависят от места, потому что восход Луны в разных городах случается в разное время.",
  },
  {
    question: "Почему время указано по Москве?",
    answer: "У сайта нет привязки к региону, поэтому все расчёты сделаны для Москвы: широта 55,76°, долгота 37,62°, время UTC+3. Для других городов восход и заход Луны и границы лунных суток сдвигаются на минуты и часы, а фаза и знак Луны остаются теми же.",
  },
  {
    question: "Как считается положение Луны на этой странице?",
    answer: "Расчёт идёт по открытой астрономической библиотеке astronomy-engine: фаза, освещённость, знак зодиака, восход и заход Луны вычисляются для заданного момента без таблиц и сторонних сервисов. Символы и описания суток взяты из одной из распространённых традиций, в других источниках они могут отличаться.",
  },
  {
    question: "Можно ли по лунному календарю выбирать день для дел?",
    answer: "На сайте лунный календарь служит описанием и поводом задать себе вопрос, а не прогнозом. Мы не делим дни на удачные и неудачные и не даём советов по здоровью, деньгам и отношениям. Решения о важных делах опирайте на свои обстоятельства, а не на фазу Луны.",
  },
];
