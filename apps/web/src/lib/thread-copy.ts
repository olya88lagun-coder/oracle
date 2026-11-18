// Тексты разбора нити: заголовок, ожидание и возврат к нити
export const THREAD_REPORT_TITLE = "Разбор нити";
export const THREAD_WAITING_BODY = "Обычно до 5 минут. Мы собираем главы разбора по вашим личным годам. Можно уйти — разбор будет в «Моём портрете».";
export const THREAD_BACK_LABEL = "Вернуться к нити";

// Блок продажи на странице нити: слова кнопок и поля дословные (как у натальной), цена приходит из ядра
export const THREAD_OFFER_TITLE = "Разбор нити";
export const THREAD_OFFER_LEAD = "Текстовый разбор вашей нити в шести главах. Это материал для размышления, а не предсказание.";
export const THREAD_OFFER_CHAPTERS = [
  "Где вы сейчас — с двенадцатью личными месяцами",
  "Семь лет вперёд",
  "Прошлые годы",
  "Четыре периода жизни",
  "Ваш ритм",
  "Три правила и вопрос на год",
] as const;
export const THREAD_OFFER_TERMS = "Разовая оплата за разбор одной даты, без подписки и автопродления. Готов за несколько минут и хранится в «Моём портрете», пока вы не удалите свои данные.";
// Разбор собирается из готовых текстов без ИИ — ИИ здесь не упоминается как участник
export const THREAD_OFFER_TEXT_NOTE = "Разбор собран из готовых текстов без ИИ.";
export const THREAD_OFFER_DATA_NOTE = "Дата рождения уходит на сервер только когда вы покупаете разбор: она хранится в покупке, пока вы не удалите свои данные.";
export const THREAD_OFFER_FREE_NOTE = "Вы владелица сайта: разбор для вас бесплатный, оплата и чек не нужны.";
// Срок возврата приходит из legal.ts (REFUND_DAYS): тот же срок стоит в оферте
export const threadOfferRefundLine = (days: number): string => `Если разбор не подойдёт, напишите нам в течение ${days} дней со дня оплаты — вернём деньги.`;
export const THREAD_OFFER_BUY = "Купить разбор";
export const THREAD_OFFER_LOGIN_BUY = "Войти и купить разбор";
export const THREAD_OFFER_FREE_BUY = "Получить разбор бесплатно";
export const THREAD_OFFER_EMAIL_LABEL = "E-mail для чека";
export const THREAD_OFFER_EXAMPLE = "Посмотреть пример разбора";
