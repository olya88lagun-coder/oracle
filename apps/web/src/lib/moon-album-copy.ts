// Тексты блока «Лунный альбом»: без оценок дней и без давления («потеряли», «не упустите» и т. п. здесь не нужны)
export const ALBUM_TITLE = "Лунный альбом";
export const ALBUM_THREAD_TITLE = "Нить Луны";
export const ALBUM_GALLERY_TITLE = "Альбом";
export const ALBUM_LEAD = "Каждый заход открывает гравюру знака и фазы Луны. Дни, в которые вы заходили, светятся на нити. Всё хранится только в этом браузере.";
export const ALBUM_FIRST_DAY = "Это ваш первый день";
export const ALBUM_FRESH = "Сегодня открылась гравюра";
export const ALBUM_HIDE = "Скрыть";

export const ALBUM_REWARDS: Record<number, string> = {
  3: "3 дня · золотая рамка",
  7: "7 дней · «Неделя с Луной»",
  14: "14 дней · «Лунный цикл»",
  30: "30 дней · «Полный круг»",
};

const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
export const albumDate = (iso: string): string => dayMonth.format(new Date(`${iso}T12:00:00Z`));

export function dayWord(count: number): string {
  const last = count % 10;
  const tens = count % 100;
  return tens >= 11 && tens <= 14 ? "дней" : last === 1 ? "день" : last >= 2 && last <= 4 ? "дня" : "дней";
}

export const daysInRow = (count: number): string => `${count} ${dayWord(count)} подряд`;

export const albumNext = (date: string, name: string): string => `Следующая откроется ${albumDate(date)}: ${name}`;
export const albumOpened = (open: number, total: number): string => `открыто ${open} из ${total}`;
export const albumVisitsNote = (lit: number, streak: number): string => `Заходов за 14 дней: ${lit}. Подряд: ${streak}`;
