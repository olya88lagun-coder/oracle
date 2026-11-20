import { phaseText } from "@oracle/content/moon";
import { MOON_EXTRA_TEXTS_ACCEPTED, PHASES_FAQ, PHASES_INTRO, yearFaq, yearIntro, type YearKind } from "@oracle/content/moon-year";
import { moonSnapshot, moonYearEvents, nextMoonEvent, PHASES, SUPERMOON_KM, type PhaseId } from "@oracle/core/moon";
import { EVENT_NAMES, isInWindow, momentLabel, SIGN_NAMES } from "./lunar-calendar";
import { lunarMonthPath, moscowDate } from "./lunar-calendar-paths";
import { phaseImage } from "./moon-images";
import { PHASE_NAMES, SIGN_NAMES_LOCATIVE } from "./moon-today";
import { yearMoonPath, yearWindow } from "./moon-year-paths";

const thousands = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const distanceLabel = (km: number): string => `${thousands.format(km / 1000)} тыс. км`;

export type YearRow = { date: string; label: string; signName: string; distance: string; superMoon: boolean; monthHref: string | null };
export type YearPage = {
  kind: YearKind;
  year: number;
  title: string;
  description: string;
  rows: YearRow[];
  intro: string | null;
  faq: { question: string; answer: string }[];
  years: { label: string; href: string; current: boolean }[];
  other: { label: string; href: string };
};

const TITLES: Record<YearKind, { name: string; other: YearKind }> = { new: { name: "Новолуния", other: "full" }, full: { name: "Полнолуния", other: "new" } };

// Все новолуния или полнолуния года по Москве: дата и время, знак Луны, расстояние до Земли; ссылка на месяц, если у него есть страница календаря
export function buildYearPage(kind: YearKind, year: number, now: Date): YearPage {
  const events = moonYearEvents(year).filter((event) => event.kind === kind);
  const rows = events.map((event): YearRow => {
    const date = moscowDate(event.at);
    const [eventYear, eventMonth] = date.split("-").map(Number) as [number, number];
    return {
      date,
      label: momentLabel(event.at),
      signName: SIGN_NAMES[event.sign],
      distance: distanceLabel(event.distanceKm),
      superMoon: kind === "full" && event.distanceKm < SUPERMOON_KM,
      monthHref: isInWindow(eventYear, eventMonth, now) ? lunarMonthPath(eventYear, eventMonth) : null,
    };
  });
  const { name, other } = TITLES[kind];
  const accepted = MOON_EXTRA_TEXTS_ACCEPTED;
  return {
    kind,
    year,
    title: `${name} ${year}`,
    description: `${name} ${year} года: точные даты и время по Москве, знак Луны и расстояние до Земли для каждого события. Бесплатно.`,
    rows,
    intro: accepted ? yearIntro(kind, year) : null,
    faq: accepted ? yearFaq({ year, kind, events: rows.map((row) => ({ label: row.label, super: row.superMoon })), supermoonKm: SUPERMOON_KM }) : [],
    years: yearWindow(now).map((item) => ({ label: String(item), href: yearMoonPath(kind, item), current: item === year })),
    other: { label: `${TITLES[other].name} ${year}`, href: yearMoonPath(other, year) },
  };
}

// Примерный вид каждой из восьми фаз для схемы: освещённость и растущая или убывающая
const SHAPE: Record<PhaseId, { illumination: number; waxing: boolean }> = {
  new: { illumination: 0, waxing: true },
  waxingCrescent: { illumination: 0.25, waxing: true },
  firstQuarter: { illumination: 0.5, waxing: true },
  waxingGibbous: { illumination: 0.75, waxing: true },
  full: { illumination: 1, waxing: true },
  waningGibbous: { illumination: 0.75, waxing: false },
  lastQuarter: { illumination: 0.5, waxing: false },
  waningCrescent: { illumination: 0.25, waxing: false },
};

export type PhasesPage = {
  now: { phase: PhaseId; phaseName: string; percent: number; signLocative: string };
  schema: { phase: PhaseId; name: string; illumination: number; waxing: boolean; current: boolean }[];
  upcoming: { name: string; label: string; date: string }[];
  cards: { phase: PhaseId; title: string; text: string; question: string; image: string | null }[];
  intro: string | null;
  faq: { question: string; answer: string }[];
};

// «Фазы Луны»: сейчас, схема из восьми фаз, ближайшие четыре главные фазы и тексты фаз (после приёмки)
export function buildPhasesPage(now: Date): PhasesPage {
  const snapshot = moonSnapshot(now);
  const upcoming: PhasesPage["upcoming"] = [];
  for (let at = now; upcoming.length < 4; ) {
    const event = nextMoonEvent(at);
    upcoming.push({ name: EVENT_NAMES[event.kind], label: momentLabel(event.at), date: moscowDate(event.at) });
    at = event.at;
  }
  return {
    now: { phase: snapshot.phase, phaseName: PHASE_NAMES[snapshot.phase], percent: Math.round(snapshot.illumination * 100), signLocative: SIGN_NAMES_LOCATIVE[snapshot.sign] },
    schema: PHASES.map((phase) => ({ phase, name: PHASE_NAMES[phase], ...SHAPE[phase], current: phase === snapshot.phase })),
    upcoming,
    cards: PHASES.flatMap((phase) => {
      const text = phaseText(phase);
      return text ? [{ phase, title: text.title, text: text.text, question: text.question, image: phaseImage(phase, 480) }] : [];
    }),
    intro: MOON_EXTRA_TEXTS_ACCEPTED ? PHASES_INTRO : null,
    faq: MOON_EXTRA_TEXTS_ACCEPTED ? [...PHASES_FAQ] : [],
  };
}
