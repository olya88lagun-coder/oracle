import { TAROT_DECK, tarotFileName, type TarotCardRef } from "@oracle/content/tarot";
import { SITE_URL } from "./site";

export const TARO_PATH = "/taro";
export const TARO_DAY_PATH = "/taro/karta-dnya";
const SUFFIX = { page: "", card: "-480", thumb: "-160" } as const;

export const taroCardPath = (card: Pick<TarotCardRef, "slug">): string => `${TARO_PATH}/karty/${card.slug}`;
export const taroCardImage = (card: Pick<TarotCardRef, "order" | "slug">, size: keyof typeof SUFFIX = "page"): string => `/taro/${tarotFileName(card)}${SUFFIX[size]}.webp`;
export const taroCardFromParam = (param: string): TarotCardRef | null => TAROT_DECK.find((card) => card.slug === param) ?? null;

export const TARO_SHARE_TEXT = (name: string): string => `Моя карта дня — ${name}. Вытяни свою`;
export const taroShareUrl = (card: Pick<TarotCardRef, "slug">): string => `${SITE_URL}${taroCardPath(card)}?utm_source=share&utm_medium=card`;
export const TARO_AUTHOR_CREDIT = "Рисунки Памелы Колман Смит, 1909 (общественное достояние)";
