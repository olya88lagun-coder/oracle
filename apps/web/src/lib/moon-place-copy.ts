// Тексты выбора города на лунных страницах: без оценок дней и без обещаний
export const PLACE_DIALOG_TITLE = "Город для лунных данных";
export const PLACE_LABEL = "Ваш город";
export const PLACE_PLACEHOLDER = "Начните вводить название";
export const PLACE_HINT = "Восход, заход и лунные сутки пересчитаются под ваше время. Выбор хранится только в вашем браузере.";
export const PLACE_LIST_LABEL = "Города";
export const PLACE_RESET = "Вернуться к Москве";
export const PLACE_CLOSE = "Закрыть";
export const PLACE_ZONE_ERROR = "Не удалось определить часовой пояс этого города в вашем браузере. Выберите другой город.";

export const placeChipAria = (label: string): string => `Город для лунных данных: ${label}. Изменить`;

// «Сейчас в городе Новосибирск — 23 ноября»: показывается, когда местная дата отличается от серверной (московской).
// Названия городов хранятся в именительном падеже, поэтому «в городе <название>»
export function placeNoteFor(placeName: string, serverDate: string, localDate: string): string | null {
  if (serverDate === localDate) return null;
  return `Сейчас в городе ${placeName} — ${localDate.replace(/\s+\d{4}$/, "")}`;
}
