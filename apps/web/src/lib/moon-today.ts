import { lunarDayText, phaseText, type LunarDayText, type PhaseText } from "@oracle/content/moon";
import { NATAL_KEY_SUMMARIES } from "@oracle/content/natal-keys";
import { lunarDay, moonRises, moonSets, moonSnapshot, moscowDayStart, nextMoonEvent, type MoonEvent, type MoonSnapshot, type PhaseId } from "@oracle/core/moon";
import type { SignId } from "@oracle/core/natal";
import { NATAL_PATH, natalPagePath } from "./natal-paths";
import { TARO_DAY_PATH } from "./taro-paths";

export const MOON_PATH = "/luna-segodnya";

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

const MOSCOW = "Europe/Moscow";
const DAY_MS = 86_400_000;
const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ru-RU", { timeZone: MOSCOW, ...options });
const timeFormat = format({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const longDate = format({ day: "numeric", month: "long", year: "numeric" });
const dayMonth = format({ day: "numeric", month: "long" });
const shortDate = format({ day: "numeric", month: "short" });
const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: MOSCOW, year: "numeric", month: "2-digit", day: "2-digit" });

const clock = (date: Date): string => timeFormat.format(date);

// «сегодня в 14:48», «завтра в 05:10», «24 ноября, 17:53»: день по Москве, а не по часовому поясу сервера
function whenLabel(date: Date, now: Date): string {
  const difference = Math.round((moscowDayStart(date).getTime() - moscowDayStart(now).getTime()) / DAY_MS);
  if (difference === 0) return `сегодня в ${clock(date)}`;
  if (difference === 1) return `завтра в ${clock(date)}`;
  if (difference === -1) return `вчера в ${clock(date)}`;
  return `${dayMonth.format(date)}, ${clock(date)}`;
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

// Всё считается для момента `now` по Москве; страница обновляется раз в час, поэтому подписи «сегодня» могут отставать не больше чем на час
export function buildMoonToday(now: Date): MoonToday {
  const dayStart = moscowDayStart(now);
  const snapshot = moonSnapshot(now);
  const day = lunarDay(now);
  const nextEvent = nextMoonEvent(now);
  const summary = NATAL_KEY_SUMMARIES[`moon-${snapshot.sign}`];
  const rise = moonRises(dayStart, 1)[0];
  const set = moonSets(dayStart, 1)[0];
  return {
    dateLabel: longDate.format(now).replace(/\s*г\.$/, ""),
    snapshot,
    phaseName: PHASE_NAMES[snapshot.phase],
    signName: SIGN_NAMES_LOCATIVE[snapshot.sign],
    signSummary: summary ? { text: summary.summary, href: natalPagePath({ slug: summary.slug }) } : null,
    lunarDay: { number: day.number, startsLabel: whenLabel(day.startsAt, now), endsLabel: whenLabel(day.endsAt, now) },
    rise: rise ? clock(rise) : null,
    set: set ? clock(set) : null,
    next: { kind: nextEvent.kind, label: `${EVENT_NAMES[nextEvent.kind]} ${whenLabel(nextEvent.at, now)}` },
    strip: Array.from({ length: STRIP_DAYS }, (_, index) => {
      // Москва без летнего времени: сутки ровно по 24 часа, полдень — через 12 часов от начала
      const noon = new Date(dayStart.getTime() + index * DAY_MS + DAY_MS / 2);
      return { date: isoDate.format(noon), label: shortDate.format(noon).replace(/\.$/, ""), isToday: index === 0, snapshot: moonSnapshot(noon) };
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
    answer: "У сайта нет привязки к региону, поэтому все расчёты сделаны для Москвы: широта 55,76°, долгота 37,62°, время UTC+3. Для других городов восход и заход Луны и границы лунных суток сдвигаются на минуты и часы, а фаза и знак Луны остаются теми же. Выбор города мы планируем добавить позже.",
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
