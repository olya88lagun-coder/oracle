import { parseBirthDate, toIsoDate } from "@oracle/core";
import type { IntentStorage } from "./matrix-save";

export const YEAR_PATH = "/arkan-2027";
const HANDOFF_KEY = "oracle-year-matrix-date";

export function prepareMatrixHandoff(storage: IntentStorage | null, iso: string): boolean {
  try {
    if (!storage) return false;
    storage.setItem(HANDOFF_KEY, iso);
    return true;
  } catch { return false; }
}

export function takeMatrixHandoff(storage: IntentStorage | null, today: Date): string | null {
  try {
    const raw = storage?.getItem(HANDOFF_KEY);
    storage?.removeItem(HANDOFF_KEY);
    const date = parseBirthDate(raw, today);
    return date ? toIsoDate(date) : null;
  } catch { return null; }
}

export function yearShareContent(arcanum: { number: number; name: string }, siteUrl: string): { title: string; text: string; url: string } {
  return {
    title: "Мой аркан 2027 года — Твой оракул",
    text: `Мой аркан 2027 года — ${arcanum.number}, ${arcanum.name}. Символ и вопрос для размышления о новом годе. Рассчитайте свой бесплатно.`,
    url: `${siteUrl}${YEAR_PATH}?utm_source=share&utm_medium=social&utm_campaign=new_year_2027`,
  };
}

export function yearSocialLinks(arcanum: { number: number; name: string }, siteUrl: string) {
  const content = yearShareContent(arcanum, siteUrl);
  return [
    { label: "Во ВКонтакте", goal: "year_arcana_vk" as const, href: `https://vk.com/share.php?${new URLSearchParams({ url: content.url, title: content.text })}` },
  ];
}

export const YEAR_FAQ = [
  { question: "Как рассчитать аркан на 2027 год по дате рождения?", answer: "Сначала считаем центр E вашей Матрицы по полной дате рождения. Затем складываем день рождения целиком, месяц и 11 — сумму цифр 2027 года. Числа больше 22 сворачиваем сложением цифр. К полученному числу прибавляем центр E и снова сворачиваем до 1–22. Число 22 оставляем без изменений." },
  { question: "Под каким арканом будет 2027 год?", answer: "У самого года есть число: 2 + 0 + 2 + 7 = 11, в нашей нумерации это аркан Сила. Но личный аркан на 2027 год у каждого свой: он зависит от даты рождения и центра Матрицы, поэтому у разных людей получаются разные арканы. Ни число года, ни аркан не предсказывают события: это тема для размышления." },
  { question: "Зачем нужен год рождения?", answer: "Он участвует в расчёте центра Матрицы. Поэтому у людей с одинаковыми днём и месяцем, но разными годами рождения результат может различаться." },
  { question: "Почему другой калькулятор показывает другой аркан?", answer: "Школы используют разные формулы: с центром Матрицы и без него, со сложением цифр или вычитанием 22. Здесь выбран вариант с центром и сложением цифр, как в нашем расчёте Матрицы. Справедливость имеет номер 8, Сила — 11." },
  { question: "Аркан действует с Нового года или со дня рождения?", answer: "На этой странице выбран календарный период с 1 января по 31 декабря 2027 года. Это отдельная символическая практика, а не расчёт возрастных периодов по периметру Матрицы." },
  { question: "Это предсказание событий на 2027 год?", answer: "Нет. Аркан предлагает тему, вопрос и действие для самопознания. Он не определяет события, отношения, здоровье или доход. Бесплатная интерпретация использует значения арканов из нашего справочника." },
  { question: "Что бесплатно и что входит в разбор за 390 ₽?", answer: "Расчёт аркана года, интерпретация и сохранение карточки бесплатны, вход не нужен. За 390 ₽ на странице Матрицы можно получить существующий полный разбор Матрицы по дате рождения. Это отдельный разбор, без годового прогноза." },
  { question: "Куда попадает дата рождения?", answer: "Расчёт выполняется в браузере. Дата не включается в адрес, карточку или события Метрики. Только при переходе к Матрице она временно сохраняется в текущей вкладке, чтобы не вводить её повторно. Сохранение в портрет на странице Матрицы требует отдельного действия." },
] as const;
