import { MATRIX_PATH } from "./arcana-paths";
import { COMPAT_PATH } from "./compat";
import { TARO_DAY_PATH, TARO_SPREADS_PATH } from "./taro-paths";

// Блок на главной «С чего начать»: вход по намерению, а не по названию практики. Каждый вход ведёт на бесплатную страницу,
// где можно начать без регистрации; ничего не уходит на сервер, это обычные ссылки
export const HOME_INTENTS_TITLE = "С чего начать";
export const HOME_INTENTS_LEAD = "Выберите, что вам сейчас ближе: мы подскажем, с какой практики удобнее начать. Всё это бесплатно.";

export type HomeIntent = { readonly title: string; readonly text: string; readonly href: string };

export const HOME_INTENTS: readonly HomeIntent[] = [
  { title: "Понять себя", text: "Рассчитайте матрицу по дате рождения и рассмотрите свои ключевые арканы.", href: MATRIX_PATH },
  { title: "Обсудить отношения", text: "Сравните две даты и найдите, где вы похожи и о чём стоит поговорить.", href: COMPAT_PATH },
  { title: "Рассмотреть выбор", text: "Расклад на два варианта: что даёт каждый и чего стоит остерегаться.", href: `${TARO_SPREADS_PATH}/vybor` },
  { title: "Практика на сегодня", text: "Выберите карту дня и заберите с собой один вопрос на вечер.", href: TARO_DAY_PATH },
];
