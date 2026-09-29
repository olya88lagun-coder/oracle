import { CHAPTER_IDS, type ChapterId, type ReportChapter } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import type { StoredChapter } from "@oracle/db";

export const reportPath = (purchaseId: string) => `/portret/razbor/${purchaseId}`;

export type PaidReport = { birthDate: string; purchaseId: string };
export type OfferState = { kind: "hidden" } | { kind: "guest" } | { kind: "save_first" } | { kind: "buy" } | { kind: "open"; purchaseId: string };

// Разбор покупается для даты портрета: если в портрете другая дата, сначала её нужно сменить — без спроса портрет не перезаписываем
export function offerState(p: { enabled: boolean; signedIn: boolean; date: string | null; profileDate: string | null; paid: readonly PaidReport[] }): OfferState {
  if (!p.enabled || !p.date) return { kind: "hidden" };
  if (!p.signedIn) return { kind: "guest" };
  const paid = p.paid.find((report) => report.birthDate === p.date);
  if (paid) return { kind: "open", purchaseId: paid.purchaseId };
  if (p.profileDate && p.profileDate !== p.date) return { kind: "save_first" };
  return { kind: "buy" };
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_ERROR = "Проверьте e-mail: на него придёт чек.";

const PURCHASE_ERRORS: Readonly<Record<string, string>> = {
  invalid_email: EMAIL_ERROR,
  invalid_intention: "Проверьте намерение: от 3 до 300 знаков.",
  active_game: "В портрете уже идёт партия. Завершите её, чтобы начать новую.",
  no_birth_date: "Не получилось сохранить дату в портрет. Попробуйте ещё раз.",
  rate_limited: "Слишком много попыток подряд. Подождите минуту и попробуйте снова.",
  unauthorized: "Сессия закончилась — войдите ещё раз.",
};

export function purchaseErrorMessage(error: unknown): string {
  return (typeof error === "string" && PURCHASE_ERRORS[error]) || "Не получилось перейти к оплате. Попробуйте ещё раз чуть позже.";
}

// «18.11.1988» — дата, по которой куплен разбор
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

// Главы в порядке оглавления; глава, которой почему-то нет, просто пропускается
export function orderedChapters(chapters: readonly StoredChapter[]): StoredChapter[] {
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  return CHAPTER_IDS.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
}

export const chapterAnchor = (id: ChapterId) => `chapter-${id}`;

const TEASER_LIMIT = 220;

// Начало главы для блока продажи: обрезаем по границе слова, чтобы обрыв выглядел как «продолжение следует», а не как ошибка
export function teaserText(text: string, limit: number = TEASER_LIMIT): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:—–-]+$/, "")}…`;
}

// Подпись под названием главы в оглавлениях: «7 Колесница · 4 Император»
export function chapterArcanaLabel(chapter: ReportChapter): string {
  if (chapter.id === "scenario") return "итог по методике ORACLE";
  return chapter.arcana.map((number) => `${number} ${arcanumByNumber(number).name}`).join(" · ");
}
