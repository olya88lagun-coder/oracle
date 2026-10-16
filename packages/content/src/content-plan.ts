import type { ArticleBasisKey } from "./article-basis";

export type PlanTopic = {
  readonly slug: string;
  readonly title: string;
  // запрос, на который первый абзац статьи отвечает сразу
  readonly primaryQuery: string;
  readonly cluster: "matrix" | "compat" | "lila" | "taro" | "general";
  // картинки: /hero.webp, /arcana/NN-slug.webp, /lila/NN-slug.webp, /taro/NN-slug.webp
  readonly image: string;
  readonly imageAlt: string;
  readonly basis: readonly ArticleBasisKey[];
  // ссылки, которые обязаны быть в тексте статьи
  readonly internalLinks: readonly string[];
  readonly status: "draft" | "published";
};

const HERO_ALT = "Матрица судьбы — символическая схема по дате рождения";

// Очередь по убыванию пользы; спрос — Яндекс Вордстат за 30.08–28.09.2026 (см. docs/superpowers/specs/2026-09-30-seo-articles-design.md).
// Тема получает status: "published" ровно тогда, когда выходит статья
export const CONTENT_PLAN: readonly PlanTopic[] = [
  {
    slug: "rasshifrovka-matritsy-sudby",
    title: "Расшифровка матрицы судьбы: как читать позиции",
    primaryQuery: "расшифровка матрицы судьбы",
    cluster: "matrix",
    image: "/hero.webp",
    imageAlt: HERO_ALT,
    basis: ["positions", "arcana", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-1-mag", "/blog/chto-takoe-matritsa-sudby"],
    status: "published",
  },
  {
    slug: "matritsa-sovmestimosti-rasshifrovka",
    title: "Матрица совместимости: как читать расшифровку",
    primaryQuery: "матрица совместимости расшифровка",
    cluster: "compat",
    image: "/arcana/06-vlyublennye.webp",
    imageAlt: "Аркан 6 «Влюблённые» — образ выбора и близости",
    basis: ["compat-texts", "compat-formulas"],
    internalLinks: ["/sovmestimost", "/matrica-sudby/arkan-6-vlyublennye"],
    status: "published",
  },
  {
    slug: "kak-schitaetsya-matritsa-sovmestimosti",
    title: "Как считается матрица совместимости по дате рождения",
    primaryQuery: "матрица совместимости по дате рождения",
    cluster: "compat",
    image: "/arcana/06-vlyublennye.webp",
    imageAlt: "Аркан 6 «Влюблённые» — образ выбора и близости",
    basis: ["compat-formulas", "compat-texts"],
    internalLinks: ["/sovmestimost", "/matrica-sudby"],
    status: "published",
  },
  {
    slug: "lila-s-ii-provodnikom",
    title: "Игра Лила с ИИ-проводником: как это работает",
    primaryQuery: "игра лила с чатом gpt",
    cluster: "lila",
    image: "/lila/68-kosmicheskoe-soznanie.webp",
    imageAlt: "Клетка 68 «Космическое сознание» в игре Лила",
    basis: ["lila-guide", "lila-rules"],
    internalLinks: ["/lila", "/blog/kak-igrat-v-lilu-onlain", "/blog/kak-sformulirovat-namerenie-dlya-lily"],
    status: "published",
  },
  {
    slug: "prednaznachenie-v-matritse-sudby",
    title: "Предназначение в матрице судьбы: личное, социальное, духовное",
    primaryQuery: "предназначение в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/01-mag.webp",
    imageAlt: "Аркан 1 «Маг» — образ первого шага",
    basis: ["positions", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-1-mag"],
    status: "published",
  },
  {
    slug: "kletki-lily-znachenie",
    title: "Клетки Лилы: что означают 72 клетки игры",
    primaryQuery: "игра лила клетки",
    cluster: "lila",
    image: "/lila/01-rozhdenie.webp",
    imageAlt: "Клетка 1 «Рождение» в игре Лила",
    basis: ["lila-cells", "lila-rules"],
    internalLinks: ["/lila", "/lila/kletki/01-rozhdenie", "/lila/kletki/68-kosmicheskoe-soznanie"],
    status: "published",
  },
  {
    slug: "zadacha-v-matritse-sudby",
    title: "Задача в матрице судьбы: что показывает точка D",
    primaryQuery: "задача в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/22-shut.webp",
    imageAlt: "Аркан 22 «Шут» — образ начала пути",
    basis: ["positions", "arcana"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-22-shut"],
    status: "published",
  },
 {
    slug: "liniya-lyubvi-v-matritse-sudby",
    title: "Линия любви в матрице судьбы: как её читать",
    primaryQuery: "линия любви в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/06-vlyublennye.webp",
    imageAlt: "Аркан 6 «Влюблённые» — образ выбора и близости",
    basis: ["positions", "arcana"],
    internalLinks: ["/matrica-sudby", "/sovmestimost"],
    status: "published",
  },
  {
    slug: "lichnost-i-tsentr-v-matritse-sudby",
    title: "Личность и центр в матрице судьбы: точки A и E",
    primaryQuery: "личность и центр в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/02-verkhovnaya-zhrica.webp",
    imageAlt: "Аркан 2 «Верховная жрица» — образ внутренней опоры",
    basis: ["positions", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-2-verkhovnaya-zhrica"],
    status: "published",
  },
  // Wordstat D12: 73 запроса со строгим оператором; уже утверждённый URL.
  {
    slug: "liniya-deneg-v-matritse-sudby",
    title: "Линия денег в матрице судьбы: как её читать",
    primaryQuery: "линия денег в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/03-imperatrica.webp",
    imageAlt: "Аркан 3 «Императрица» — образ созидания",
    basis: ["positions", "arcana"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-3-imperatrica"],
    status: "published",
  },

  // Wordstat D01: 1234 запросов со строгим оператором (РФ; сентябрь–октябрь 2026).
  {
    slug: "sochetaniya-kart-taro",
    title: "Сочетания карт Таро: как читать две и три карты вместе",
    primaryQuery: "сочетание карт таро",
    cluster: "taro",
    image: "/taro/02-mag.webp",
    imageAlt: "Карта Таро «Маг» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck"],
    internalLinks: ["/taro", "/taro/karty/mag", "/taro/karty/kubki-tuz"],
    status: "published",
  },

  // Wordstat D09: 146 запросов со строгим оператором (РФ; сентябрь–октябрь 2026).
  {
    slug: "masti-taro",
    title: "Масти Таро: Жезлы, Кубки, Мечи и Пентакли",
    primaryQuery: "масти таро",
    cluster: "taro",
    image: "/taro/23-zhezly-tuz.webp",
    imageAlt: "Карта Таро «Туз Жезлов» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck"],
    internalLinks: ["/taro", "/taro/karty/zhezly-tuz", "/taro/karty/kubki-tuz"],
    status: "published",
  },

  // Wordstat D03: 114 запросов со строгим оператором (РФ; сентябрь–октябрь 2026).
  {
    slug: "taro-dlya-nachinayushchih",
    title: "Таро для начинающих: с чего начать чтение карт",
    primaryQuery: "таро для начинающих",
    cluster: "taro",
    image: "/taro/01-shut.webp",
    imageAlt: "Карта Таро «Шут» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/shut"],
    status: "published",
  },

  // Wordstat D04: 89 запросов со строгим оператором (РФ; сентябрь–октябрь 2026).
  {
    slug: "kak-chitat-karty-taro",
    title: "Как читать карты Таро в раскладе: позиция, символ и контекст",
    primaryQuery: "как читать карты таро",
    cluster: "taro",
    image: "/taro/18-zvezda.webp",
    imageAlt: "Карта Таро «Звезда» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck"],
    internalLinks: ["/taro", "/taro/karty/zvezda", "/taro/karta-dnya"],
    status: "draft",
  },

  // Wordstat D02: 39 запросов со строгим оператором (РФ; сентябрь–октябрь 2026).
  {
    slug: "perevernutye-karty-taro",
    title: "Перевёрнутые карты Таро: нужно ли учитывать и как читать",
    primaryQuery: "перевернутые карты таро",
    cluster: "taro",
    image: "/taro/17-bashnya.webp",
    imageAlt: "Карта Таро «Башня» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/bashnya"],
    status: "draft",
  },

  // Wordstat D10: 34 запросов со строгим оператором (РФ; сентябрь–октябрь 2026).
  {
    slug: "pridvornye-karty-taro",
    title: "Придворные карты Таро: Паж, Рыцарь, Королева и Король",
    primaryQuery: "придворные карты таро",
    cluster: "taro",
    image: "/taro/35-zhezly-koroleva.webp",
    imageAlt: "Карта Таро «Королева Жезлов» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck"],
    internalLinks: ["/taro", "/taro/karty/zhezly-koroleva", "/taro/karty/kubki-pazh"],
    status: "published",
  },

  // Wordstat D06: 33 запросов со строгим оператором (РФ; сентябрь–октябрь 2026).
  {
    slug: "rasklad-taro-na-tri-karty",
    title: "Расклад Таро на три карты: схемы для самостоятельной практики",
    primaryQuery: "расклад таро на три карты",
    cluster: "taro",
    image: "/taro/38-kubki-dvoyka.webp",
    imageAlt: "Карта Таро «Двойка Кубков» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/kubki-dvoyka"],
    status: "draft",
  },

  // Wordstat D05: 16 запросов со строгим оператором (РФ; сентябрь–октябрь 2026).
  {
    slug: "kak-zadat-vopros-taro",
    title: "Как задавать вопросы картам Таро: примеры формулировок",
    primaryQuery: "как задать вопрос таро",
    cluster: "taro",
    image: "/taro/03-verkhovnaya-zhrica.webp",
    imageAlt: "Карта Таро «Верховная Жрица» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/verkhovnaya-zhrica"],
    status: "published",
  },

  // Пополнение очереди 16.10.2026. Спрос — выгрузки Яндекс Вордстата за 21.08–21.09.2026 (все регионы, широкое соответствие,
  // не строгая частотность); отбор и отброшенные идеи — docs/seo/wordstat-2026-10-09-plan.md, раздел «Пополнение 16.10.2026».
  // Перед письмом автописатель обязан сравнить тему с опубликованными статьями: ответ на главный вопрос не должен повторяться.

  // «расчет матрицы судьбы» 16491, «расчет матрицы судьбы по дате рождения» 1136, «матрица судьбы самостоятельно» 1185.
  {
    slug: "kak-rasschitat-matritsu-sudby",
    title: "Как рассчитать матрицу судьбы по дате рождения самостоятельно",
    primaryQuery: "расчет матрицы судьбы по дате рождения",
    cluster: "matrix",
    image: "/hero.webp",
    imageAlt: HERO_ALT,
    basis: ["matrix-formulas", "positions"],
    internalLinks: ["/matrica-sudby", "/blog/rasshifrovka-matritsy-sudby", "/blog/zadacha-v-matritse-sudby"],
    status: "draft",
  },

  // «матрица судьбы мужчина» 3877, «матрица судьбы женщина» 3445, «матрица судьбы мужская» 743.
  {
    slug: "matritsa-sudby-dlya-muzhchiny-i-zhenshchiny",
    title: "Матрица судьбы для мужчины и для женщины: чем отличается расчёт",
    primaryQuery: "матрица судьбы для мужчины и женщины",
    cluster: "matrix",
    image: "/arcana/04-imperator.webp",
    imageAlt: "Аркан 4 «Император» — образ опоры и порядка",
    basis: ["matrix-formulas", "positions", "arcana"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-4-imperator", "/blog/rasshifrovka-matritsy-sudby"],
    status: "draft",
  },

  // «матрица судьбы род» 1479, «матрица судьбы линии рода» 575.
  {
    slug: "rodovoj-kvadrat-v-matritse-sudby",
    title: "Родовой квадрат в матрице судьбы: как читать линии отца и матери",
    primaryQuery: "род в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/05-ierofant.webp",
    imageAlt: "Аркан 5 «Иерофант» — образ преемственности и опыта семьи",
    basis: ["positions", "arcana", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-5-ierofant", "/blog/rasshifrovka-matritsy-sudby"],
    status: "draft",
  },

  // «какие вопросы задать таро про отношения» 869, «…про парня» 677, «…про мужчину» 247, «…про бывшего» 230.
  {
    slug: "voprosy-dlya-taro-pro-otnosheniya",
    title: "Вопросы для Таро об отношениях: как спросить о близости, а не о чужих мыслях",
    primaryQuery: "какие вопросы задать таро про отношения",
    cluster: "taro",
    image: "/taro/07-vlyublennye.webp",
    imageAlt: "Карта Таро «Влюблённые» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/vlyublennye", "/taro/karty/kubki-dvoyka", "/blog/kak-zadat-vopros-taro"],
    status: "draft",
  },

  // «таро вопрос про будущее какой задать» 171, «какие вопросы задать таро на будущее» 148, «как задавать вопрос про будущее таро» 110.
  {
    slug: "voprosy-dlya-taro-pro-buduschee",
    title: "Вопросы для Таро о будущем: как спрашивать без предсказаний",
    primaryQuery: "какие вопросы задать таро на будущее",
    cluster: "taro",
    image: "/taro/11-koleso-fortuny.webp",
    imageAlt: "Карта Таро «Колесо Фортуны» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/koleso-fortuny", "/blog/kak-zadat-vopros-taro"],
    status: "draft",
  },

  // «как задать вопрос таро про работу» 152, «как правильно задать вопрос таро про работу» 100, «какие вопросы задать таро про работу» 50.
  {
    slug: "voprosy-dlya-taro-pro-rabotu-i-dengi",
    title: "Вопросы для Таро о работе и деньгах: примеры формулировок",
    primaryQuery: "как задать вопрос таро про работу",
    cluster: "taro",
    image: "/taro/65-pentakli-tuz.webp",
    imageAlt: "Карта Таро «Туз Пентаклей» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/pentakli-tuz", "/blog/kak-zadat-vopros-taro"],
    status: "draft",
  },

  // «трансформационная игра лила» 848, «лила игра самопознания» 456, «игра лила зачем» 443, «психологическая игра лила» 322.
  {
    slug: "lila-igra-samopoznaniya",
    title: "Игра Лила: игра самопознания, а не гадание — зачем в неё играют",
    primaryQuery: "лила игра самопознания",
    cluster: "lila",
    image: "/lila/36-yasnost-soznaniya.webp",
    imageAlt: "Клетка 36 «Ясность сознания» в игре Лила",
    basis: ["lila-rules", "lila-cells", "lila-guide"],
    internalLinks: ["/lila", "/lila/kletki/36-yasnost-soznaniya", "/blog/kak-igrat-v-lilu-onlain", "/blog/kak-sformulirovat-namerenie-dlya-lily"],
    status: "draft",
  },

  // «пример игры лила» 89, «игра лила ход игры» 50, «как проходит игра лила» 19.
  {
    slug: "primer-partii-v-lilu",
    title: "Пример партии в Лилу: ход за ходом от первой шестёрки до стрелы",
    primaryQuery: "пример игры лила",
    cluster: "lila",
    image: "/lila/10-ochishchenie.webp",
    imageAlt: "Клетка 10 «Очищение» в игре Лила",
    basis: ["lila-rules", "lila-cells"],
    internalLinks: ["/lila", "/lila/kletki/10-ochishchenie", "/lila/kletki/23-nebesnyy-plan", "/blog/kak-igrat-v-lilu-onlain"],
    status: "draft",
  },

  // Пополнение 16.10.2026, часть 2. Тир A — формулировка есть в выгрузках Вордстата за 21.08–21.09.2026 (широкое соответствие).

  // «матрица судьбы арканов» 67745, «значение арканов в матрице судьбы» 4343. Обзор-хаб со ссылками на все страницы арканов; значения не пересказывать.
  {
    slug: "vse-22-arkana-matritsy-sudby",
    title: "Все 22 аркана матрицы судьбы: названия, номера и главные темы",
    primaryQuery: "арканы матрицы судьбы",
    cluster: "matrix",
    image: "/hero.webp",
    imageAlt: HERO_ALT,
    basis: ["arcana", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-1-mag", "/matrica-sudby/arkan-22-shut", "/blog/rasshifrovka-matritsy-sudby"],
    status: "draft",
  },

  // «энергии в матрице судьбы» 4253, «какой аркан в матрице судьбы» 2240, «что значат арканы в матрице судьбы» 1590.
  {
    slug: "chto-takoe-arkan-i-energiya-v-matritse-sudby",
    title: "Что такое аркан и энергия в матрице судьбы: простыми словами",
    primaryQuery: "энергии в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/21-mir.webp",
    imageAlt: "Аркан 21 «Мир» — образ завершённости",
    basis: ["arcana", "positions"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-21-mir", "/blog/chto-takoe-matritsa-sudby"],
    status: "draft",
  },

  // «какие вопросы задать таро про себя» 139, «…можно задать таро про себя» 110, «задать вопрос картам таро про себя» 104.
  {
    slug: "voprosy-dlya-taro-pro-sebya",
    title: "Вопросы для Таро о себе: как спросить о своих чувствах, выборе и ресурсе",
    primaryQuery: "какие вопросы задать таро про себя",
    cluster: "taro",
    image: "/taro/03-verkhovnaya-zhrica.webp",
    imageAlt: "Карта Таро «Верховная Жрица» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/verkhovnaya-zhrica", "/blog/kak-zadat-vopros-taro"],
    status: "draft",
  },

  // «матрица судьбы схема» 363, «квадрат матрицы судьбы» 334, «таблица» 266, «круг» 244, «картинка» 216. Порядок точек — MATRIX_POINTS в matrix.ts.
  {
    slug: "skhema-matritsy-sudby",
    title: "Схема матрицы судьбы: квадраты, диагонали и точки на одном рисунке",
    primaryQuery: "схема матрицы судьбы",
    cluster: "matrix",
    image: "/hero.webp",
    imageAlt: HERO_ALT,
    basis: ["matrix-formulas", "positions"],
    internalLinks: ["/matrica-sudby", "/blog/rasshifrovka-matritsy-sudby", "/blog/zadacha-v-matritse-sudby"],
    status: "draft",
  },

  // «задать вопрос таро онлайн» 558, «таро заданный вопрос онлайн» 558, «…бесплатно» 425. На сайте только карта дня: онлайн-расклад по вопросу не обещать.
  {
    slug: "zadat-vopros-taro-onlayn",
    title: "Задать вопрос Таро онлайн: что даёт карта дня и чем она отличается от расклада",
    primaryQuery: "задать вопрос таро онлайн",
    cluster: "taro",
    image: "/taro/02-mag.webp",
    imageAlt: "Карта Таро «Маг» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/mag", "/blog/kak-zadat-vopros-taro"],
    status: "draft",
  },

  // «аркан профессии матрица судьбы» 667, «профессия по матрице судьбы» 367, «какая профессия» 264. Опора — разделы «В деньгах и деле»; списков профессий и советов о карьере не давать.
  {
    slug: "professiya-po-matritse-sudby",
    title: "Профессия и дело в матрице судьбы: как читать раздел о деньгах и деле",
    primaryQuery: "профессия по матрице судьбы",
    cluster: "matrix",
    image: "/arcana/08-spravedlivost.webp",
    imageAlt: "Аркан 8 «Справедливость» — образ честного обмена",
    basis: ["arcana", "positions"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-8-spravedlivost", "/blog/liniya-deneg-v-matritse-sudby"],
    status: "draft",
  },

  // «матрица судьбы в плюсе» 989, «минус» 818, «энергии в плюсе» 112. Опора — списки «В ресурсе» и «В перекосе» из текстов арканов.
  {
    slug: "plyus-i-minus-arkana-v-matritse-sudby",
    title: "Ресурс и перекос аркана: что значат «плюс» и «минус» в матрице судьбы",
    primaryQuery: "матрица судьбы в плюсе и в минусе",
    cluster: "matrix",
    image: "/arcana/11-sila.webp",
    imageAlt: "Аркан 11 «Сила» — образ мягкой выдержки",
    basis: ["arcana", "positions"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-11-sila", "/blog/rasshifrovka-matritsy-sudby"],
    status: "draft",
  },

  // «матрица судьбы каналы» 3210, «денежный канал» 1100, «любовный канал» 464, «канал отношений» 459. У нас «канал» называется «линия»; не дублировать две статьи, а дать обзор и связь.
  {
    slug: "kanaly-v-matritse-sudby",
    title: "Каналы в матрице судьбы: денежный и любовный канал — что это",
    primaryQuery: "матрица судьбы каналы",
    cluster: "matrix",
    image: "/hero.webp",
    imageAlt: HERO_ALT,
    basis: ["positions", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/blog/liniya-lyubvi-v-matritse-sudby", "/blog/liniya-deneg-v-matritse-sudby"],
    status: "draft",
  },

  // «матрица судьбы таро» 1304, «арканы таро в матрице судьбы» 428. Нумерация разная: Сила — 11 в Матрице и 8 в Таро, Справедливость — 8 и 12, Шут — 22 и 0.
  {
    slug: "arkany-matritsy-i-karty-taro",
    title: "Арканы матрицы судьбы и карты Таро: почему номера и названия расходятся",
    primaryQuery: "матрица судьбы таро",
    cluster: "matrix",
    image: "/arcana/11-sila.webp",
    imageAlt: "Аркан 11 «Сила» — образ мягкой выдержки",
    basis: ["arcana", "tarot", "tarot-deck"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-11-sila", "/taro", "/taro/karty/sila"],
    status: "draft",
  },

  // «арканы в совместимости матрица судьбы» 2496. Хаб по «Союзу» из compat-arcana.md: коротко, без пересказа фраз; не повторять статью о структуре результата.
  {
    slug: "arkany-v-sovmestimosti-matritsa-sudby",
    title: "Аркан пары в матрице совместимости: 22 темы союза",
    primaryQuery: "арканы в совместимости матрица судьбы",
    cluster: "compat",
    image: "/arcana/06-vlyublennye.webp",
    imageAlt: "Аркан 6 «Влюблённые» — образ выбора и близости",
    basis: ["compat-texts", "compat-formulas"],
    internalLinks: ["/sovmestimost", "/matrica-sudby/arkan-6-vlyublennye", "/blog/matritsa-sovmestimosti-rasshifrovka"],
    status: "draft",
  },

  // «сколько вопросов можно задать таро» 38, «…картам таро» 24, «какие вопросы нельзя задавать таро» 24. Без запретов «по традиции»: только практика самонаблюдения.
  {
    slug: "skolko-voprosov-mozhno-zadat-taro",
    title: "Сколько вопросов можно задать Таро и можно ли переспрашивать",
    primaryQuery: "сколько вопросов можно задать таро",
    cluster: "taro",
    image: "/taro/21-sud.webp",
    imageAlt: "Карта Таро «Суд» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/sud", "/blog/kak-zadat-vopros-taro"],
    status: "draft",
  },

  // «матрица судьбы ребенка бесплатно» 298, «онлайн ребенок» 102. Расчёт по одной дате; без ярлыков ребёнку, прогнозов, педагогических и медицинских советов.
  {
    slug: "matritsa-sudby-rebenka",
    title: "Матрица судьбы ребёнка: можно ли считать и как читать бережно",
    primaryQuery: "матрица судьбы ребенка",
    cluster: "matrix",
    image: "/arcana/19-solnce.webp",
    imageAlt: "Аркан 19 «Солнце» — образ света и радости",
    basis: ["matrix-formulas", "arcana", "positions"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-19-solnce", "/blog/rasshifrovka-matritsy-sudby"],
    status: "draft",
  },

  // «игра лила ведущая» 130, «мастера игры лила» 192, «проводник игры лила» 294. Не повторять статью об ИИ-проводнике: отвечать на вопрос «обязателен ли ведущий».
  {
    slug: "nuzhen-li-vedushchij-dlya-lily",
    title: "Нужен ли ведущий для игры Лила: самостоятельная партия и проводник",
    primaryQuery: "игра лила ведущая",
    cluster: "lila",
    image: "/lila/17-sostradanie.webp",
    imageAlt: "Клетка 17 «Сострадание» в игре Лила",
    basis: ["lila-rules", "lila-guide"],
    internalLinks: ["/lila", "/lila/kletki/17-sostradanie", "/blog/lila-s-ii-provodnikom", "/blog/kak-igrat-v-lilu-onlain"],
    status: "draft",
  },

  // «игра лила время игры» 31, «когда заканчивается игра лила» 25, «сколько длится игра лила» 8. Пределы ходов — LILA_MAX_MOVES и LILA_MIN_MOVES_TO_FINISH из lila.ts; правила входа и цели уже в статье «Как играть в Лилу онлайн».
  {
    slug: "skolko-dlitsya-partiya-v-lilu",
    title: "Сколько длится партия в Лилу: ходы, пауза и завершение",
    primaryQuery: "сколько длится игра лила",
    cluster: "lila",
    image: "/lila/68-kosmicheskoe-soznanie.webp",
    imageAlt: "Клетка 68 «Космическое Сознание» в игре Лила",
    basis: ["lila-rules"],
    internalLinks: ["/lila", "/lila/kletki/68-kosmicheskoe-soznanie", "/blog/kak-igrat-v-lilu-onlain"],
    status: "draft",
  },

  // Спрос не замерен (формулировка наша). Опора — lilaVisitCounts и lilaQuestionIndex в lila.ts: при повторном заходе показывается другой из трёх вопросов клетки.
  {
    slug: "povtornoe-poseshchenie-kletki-v-lile",
    title: "Повторная клетка в Лиле: почему вопросы меняются при возврате",
    primaryQuery: "что значит вернуться на клетку в игре лила",
    cluster: "lila",
    image: "/lila/12-zavist.webp",
    imageAlt: "Клетка 12 «Зависть» в игре Лила",
    basis: ["lila-rules", "lila-cells"],
    internalLinks: ["/lila", "/lila/kletki/12-zavist", "/lila/kletki/08-alchnost", "/blog/zmei-i-strely-lily"],
    status: "draft",
  },

  // Тир B — тема опирается на тексты и код сайта, но спрос не замерен: до выпуска проверить строгую частотность (docs/seo/wordstat-2026-10-09-plan.md).

  // Нужен замер «таро да нет». Не придумывать карты «да»/«нет»: в наших текстах их нет.
  {
    slug: "taro-da-ili-net",
    title: "Таро «да или нет»: почему карта отвечает образом, а не словом",
    primaryQuery: "таро да или нет",
    cluster: "taro",
    image: "/taro/12-spravedlivost.webp",
    imageAlt: "Карта Таро «Справедливость» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/spravedlivost", "/blog/kak-zadat-vopros-taro"],
    status: "draft",
  },

  // Нужен замер. Позиция сайта: карта — символ, не предсказание; без ссылок на исследования и «научные доказательства».
  {
    slug: "rabotaet-li-taro",
    title: "Работает ли Таро: честный взгляд на карты как на символы самопознания",
    primaryQuery: "работает ли таро",
    cluster: "taro",
    image: "/taro/19-luna.webp",
    imageAlt: "Карта Таро «Луна» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/luna"],
    status: "draft",
  },

  // Нужен замер. Групповой обзор трёх карт, не три значения; без запугивания и пророчеств.
  {
    slug: "tyazhelye-karty-taro",
    title: "Тяжёлые карты Таро: Смерть, Башня и Дьявол без страха",
    primaryQuery: "страшные карты таро",
    cluster: "taro",
    image: "/taro/17-bashnya.webp",
    imageAlt: "Карта Таро «Башня» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/smert", "/taro/karty/bashnya", "/taro/karty/dyavol"],
    status: "draft",
  },

  // Нужен замер. Групповая тема по разделам «В отношениях»; не повторять статью о вопросах про отношения.
  {
    slug: "karty-taro-ob-otnosheniyakh",
    title: "Карты Таро об отношениях: какие образы поднимают тему близости",
    primaryQuery: "карты таро про любовь",
    cluster: "taro",
    image: "/taro/49-kubki-koroleva.webp",
    imageAlt: "Карта Таро «Королева Кубков» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/kubki-koroleva", "/taro/karty/kubki-desyatka", "/taro/karty/vlyublennye"],
    status: "draft",
  },

  // Нужен замер. Групповая тема по разделам «В деле и деньгах»; без финансовых советов.
  {
    slug: "karty-taro-o-rabote-i-dele",
    title: "Карты Таро о работе и деле: какие образы поднимают тему труда",
    primaryQuery: "карты таро про работу",
    cluster: "taro",
    image: "/taro/08-kolesnica.webp",
    imageAlt: "Карта Таро «Колесница» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/kolesnica", "/taro/karty/pentakli-vosmerka", "/taro/karty/mechi-tuz"],
    status: "draft",
  },

  // Нужен замер. Групповой обзор трёх карт.
  {
    slug: "karty-taro-o-vybore",
    title: "Карты Таро о выборе: какие образы показывают развилку",
    primaryQuery: "карты таро выбор",
    cluster: "taro",
    image: "/taro/52-mechi-dvoyka.webp",
    imageAlt: "Карта Таро «Двойка Мечей» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/mechi-dvoyka", "/taro/karty/vlyublennye", "/taro/karty/kubki-semerka"],
    status: "draft",
  },

  // Нужен замер. Не повторять статью «Тузы Таро»: здесь взгляд на тему начала.
  {
    slug: "karty-taro-o-novom-nachale",
    title: "Карты Таро о новом начале: Шут, Маг и четыре Туза",
    primaryQuery: "карты таро новое начало",
    cluster: "taro",
    image: "/taro/01-shut.webp",
    imageAlt: "Карта Таро «Шут» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/shut", "/taro/karty/mag", "/taro/karty/zhezly-tuz"],
    status: "draft",
  },

  // Нужен замер. Групповой обзор; без пророчеств об «окончании» чего-либо в жизни читателя.
  {
    slug: "karty-taro-o-zavershenii",
    title: "Карты Таро о завершении: какие образы говорят о конце цикла",
    primaryQuery: "карты таро завершение",
    cluster: "taro",
    image: "/taro/22-mir.webp",
    imageAlt: "Карта Таро «Мир» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/mir", "/taro/karty/sud", "/taro/karty/zhezly-desyatka"],
    status: "draft",
  },

  // Нужен замер. Групповой обзор трёх карт.
  {
    slug: "karty-taro-o-pauze-i-ozhidanii",
    title: "Карты Таро о паузе и ожидании: Повешенный, Отшельник, Четвёрка Мечей",
    primaryQuery: "карты таро пауза ожидание",
    cluster: "taro",
    image: "/taro/13-poveshennyj.webp",
    imageAlt: "Карта Таро «Повешенный» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/poveshennyj", "/taro/karty/otshelnik", "/taro/karty/mechi-chetverka"],
    status: "draft",
  },

  // Нужен замер. Не повторять статью о мастях: здесь только четыре карты ранга «Туз».
  {
    slug: "tuzy-taro",
    title: "Тузы Таро: четыре начала в четырёх мастях",
    primaryQuery: "тузы таро",
    cluster: "taro",
    image: "/taro/23-zhezly-tuz.webp",
    imageAlt: "Карта Таро «Туз Жезлов» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karty/zhezly-tuz", "/taro/karty/kubki-tuz", "/taro/karty/mechi-tuz", "/taro/karty/pentakli-tuz"],
    status: "draft",
  },

  // Нужен замер. Опираться только на тексты карт и порядок колоды, общих нумерологических значений не вводить.
  {
    slug: "chisla-v-mladshikh-arkanakh-taro",
    title: "Числа в младших арканах Таро: что меняется от Туза до Десятки",
    primaryQuery: "значение чисел в таро",
    cluster: "taro",
    image: "/taro/25-zhezly-troyka.webp",
    imageAlt: "Карта Таро «Тройка Жезлов» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/zhezly-troyka", "/taro/karty/kubki-shesterka", "/taro/karty/mechi-desyatka"],
    status: "draft",
  },

  // Нужен замер. Упражнение с физической колодой; на сайте только карта дня, онлайн-расклад не обещать.
  {
    slug: "rasklad-taro-na-den",
    title: "Расклад Таро на день: упражнение на утро и вечер",
    primaryQuery: "расклад таро на день",
    cluster: "taro",
    image: "/taro/20-solnce.webp",
    imageAlt: "Карта Таро «Солнце» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/solnce"],
    status: "draft",
  },

  // Нужен замер. Упражнение с физической колодой; не прогнозировать события недели.
  {
    slug: "rasklad-taro-na-nedelyu",
    title: "Расклад Таро на неделю: семь карт как дневник наблюдений",
    primaryQuery: "расклад таро на неделю",
    cluster: "taro",
    image: "/taro/28-zhezly-shesterka.webp",
    imageAlt: "Карта Таро «Шестёрка Жезлов» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/zhezly-shesterka"],
    status: "draft",
  },

  // Нужен замер. Позиции расклада придуманы нами как упражнение — прямо так и назвать; не про чужие мысли.
  {
    slug: "rasklad-taro-na-otnosheniya-dlya-sebya",
    title: "Расклад Таро на отношения: упражнение о вашей позиции, а не о партнёре",
    primaryQuery: "расклад таро на отношения",
    cluster: "taro",
    image: "/taro/42-kubki-shesterka.webp",
    imageAlt: "Карта Таро «Шестёрка Кубков» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/kubki-shesterka", "/blog/kak-zadat-vopros-taro"],
    status: "draft",
  },

  // Нужен замер. Позиции взяты из структуры наших страниц карт (Суть, Ресурс, Перекос, Действие на сегодня).
  {
    slug: "rasklad-sut-resurs-perekos-deystvie",
    title: "Расклад «Суть — ресурс — перекос — действие»: читаем карту по её структуре",
    primaryQuery: "расклад таро на самопознание",
    cluster: "taro",
    image: "/taro/09-sila.webp",
    imageAlt: "Карта Таро «Сила» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/sila"],
    status: "draft",
  },

  // Нужен замер. Запись карты дня на сайте не ведётся (хранится только в браузере на сутки): вести дневник вручную.
  {
    slug: "dnevnik-taro",
    title: "Дневник Таро: как записывать карту дня и что в нём замечать",
    primaryQuery: "дневник таро",
    cluster: "taro",
    image: "/taro/10-otshelnik.webp",
    imageAlt: "Карта Таро «Отшельник» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/otshelnik"],
    status: "draft",
  },

  // Нужен замер. Опора — «Как карта дня» и «Действие на сегодня» в текстах карт.
  {
    slug: "karta-dnya-ne-podkhodit",
    title: "Карта дня «не подходит»: что делать, если образ не совпал с днём",
    primaryQuery: "карта дня таро не подходит",
    cluster: "taro",
    image: "/taro/57-mechi-semerka.webp",
    imageAlt: "Карта Таро «Семёрка Мечей» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/mechi-semerka"],
    status: "draft",
  },

  // Нужен замер. Правила сайта: выбор запоминается до полуночи по Москве (TaroGuide).
  {
    slug: "kogda-vytyagivat-kartu-dnya",
    title: "Когда вытягивать карту дня: утром, вечером и как с полуночью",
    primaryQuery: "когда вытягивать карту дня",
    cluster: "taro",
    image: "/taro/15-umerennost.webp",
    imageAlt: "Карта Таро «Умеренность» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/umerennost"],
    status: "draft",
  },

  // Нужен замер. Карта дня выбирается случайно из всей колоды (tarot-practice): повтор не знак.
  {
    slug: "povtoryayushchayasya-karta-taro",
    title: "Одна и та же карта Таро выпадает снова: как это читать",
    primaryQuery: "повторяется карта таро",
    cluster: "taro",
    image: "/taro/05-imperator.webp",
    imageAlt: "Карта Таро «Император» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/imperator"],
    status: "draft",
  },

  // Нужен замер. Опора — страница карты дня: три рубашки, карта под любой выбирается случайно.
  {
    slug: "kak-vybirat-kartu-dnya-iz-trekh",
    title: "Три рубашки на выбор: интуиция или случай при выборе карты дня",
    primaryQuery: "выбрать карту дня таро",
    cluster: "taro",
    image: "/taro/14-smert.webp",
    imageAlt: "Карта Таро «Смерть» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/smert"],
    status: "draft",
  },

  // Нужен замер. Опора — описания рисунка в разделе «Суть» наших текстов; авторство и год рисунков — только как на сайте.
  {
    slug: "kak-chitat-kartinku-taro",
    title: "Как читать картинку на карте Таро: жесты, цвета и символы",
    primaryQuery: "символы на картах таро",
    cluster: "taro",
    image: "/taro/04-imperatrica.webp",
    imageAlt: "Карта Таро «Императрица» из колоды Райдера — Уэйта",
    basis: ["tarot", "tarot-deck", "tarot-practice"],
    internalLinks: ["/taro", "/taro/karta-dnya", "/taro/karty/imperatrica", "/taro/karty/kolesnica"],
    status: "draft",
  },

  // Нужен замер. Тон поддержки без диагнозов и советов о здоровье; опора — разделы «Перекос» и «Вопрос для себя».
  {
    slug: "matritsa-sudby-pugaet",
    title: "Матрица судьбы пугает: что делать, если результат кажется тяжёлым",
    primaryQuery: "матрица судьбы страшно",
    cluster: "matrix",
    image: "/arcana/18-luna.webp",
    imageAlt: "Аркан 18 «Луна» — образ неясности и снов",
    basis: ["arcana", "positions"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-18-luna", "/blog/chto-takoe-matritsa-sudby"],
    status: "draft",
  },

  // Нужен замер. Опора — «Действие на сегодня» и «Вопрос для себя» из текстов арканов.
  {
    slug: "matritsa-sudby-dlya-samopoznaniya",
    title: "Матрица судьбы для самопознания: упражнение на семь дней",
    primaryQuery: "как работать с матрицей судьбы",
    cluster: "matrix",
    image: "/arcana/09-otshelnik.webp",
    imageAlt: "Аркан 9 «Отшельник» — образ внутреннего поиска",
    basis: ["arcana", "positions"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-9-otshelnik", "/blog/rasshifrovka-matritsy-sudby"],
    status: "draft",
  },

  // «матрица судьбы задачи» 450, «аркан предназначения» 179, «где предназначение» 137. Сравнительная статья: не пересказывать две опубликованные, а сопоставить.
  {
    slug: "zadacha-i-prednaznachenie-v-matritse-sudby",
    title: "Задача и предназначение в матрице судьбы: в чём разница",
    primaryQuery: "матрица судьбы задачи и предназначение",
    cluster: "matrix",
    image: "/arcana/17-zvezda.webp",
    imageAlt: "Аркан 17 «Звезда» — образ ориентира",
    basis: ["positions", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/blog/zadacha-v-matritse-sudby", "/blog/prednaznachenie-v-matritse-sudby"],
    status: "draft",
  },

  // Нужен замер. Опора — строки «Вопрос для двоих» в compat-arcana.md; без ярлыков для пары.
  {
    slug: "kak-obsudit-sovmestimost-s-partnerom",
    title: "Как обсудить совместимость с партнёром: вопросы для двоих",
    primaryQuery: "как обсудить совместимость с партнером",
    cluster: "compat",
    image: "/arcana/14-umerennost.webp",
    imageAlt: "Аркан 14 «Умеренность» — образ баланса",
    basis: ["compat-texts", "compat-formulas"],
    internalLinks: ["/sovmestimost", "/matrica-sudby/arkan-14-umerennost", "/blog/matritsa-sovmestimosti-rasshifrovka"],
    status: "draft",
  },

  // Нужен замер. Без вердиктов о «несовместимости»; опора — строки «Где стоит присмотреться».
  {
    slug: "arkan-pary-kazhetsya-trudnym",
    title: "Аркан пары кажется трудным: как читать раздел «Где стоит присмотреться»",
    primaryQuery: "сложный аркан совместимости",
    cluster: "compat",
    image: "/arcana/16-bashnya.webp",
    imageAlt: "Аркан 16 «Башня» — образ резких перемен",
    basis: ["compat-texts"],
    internalLinks: ["/sovmestimost", "/matrica-sudby/arkan-16-bashnya", "/blog/matritsa-sovmestimosti-rasshifrovka"],
    status: "draft",
  },

  // Нужен замер. Опора — запись мысли к ходу (LILA_NOTE_MAX_CHARS в lila.ts) и три вопроса клеток.
  {
    slug: "dnevnik-lily",
    title: "Дневник Лилы: как записывать мысли после клетки",
    primaryQuery: "дневник игры лила",
    cluster: "lila",
    image: "/lila/37-dzhnyana.webp",
    imageAlt: "Клетка 37 «Джняна» в игре Лила",
    basis: ["lila-rules", "lila-cells"],
    internalLinks: ["/lila", "/lila/kletki/37-dzhnyana", "/blog/kak-igrat-v-lilu-onlain"],
    status: "draft",
  },

  // Нужен замер. Опора — правила завершения в lila.ts и проверки итога проводника в packages/ai; без обещаний «трансформации».
  {
    slug: "itog-partii-v-lilu",
    title: "Итог партии в Лиле: как подвести черту после последней клетки",
    primaryQuery: "итог игры лила",
    cluster: "lila",
    image: "/lila/66-plan-blazhenstva.webp",
    imageAlt: "Клетка 66 «План блаженства» в игре Лила",
    basis: ["lila-rules", "lila-guide"],
    internalLinks: ["/lila", "/lila/kletki/66-plan-blazhenstva", "/blog/lila-s-ii-provodnikom"],
    status: "draft",
  },

  // Нужен замер. Обзор-хаб для перелинковки; описывать только то, что делает сайт.
  {
    slug: "tri-praktiki-samopoznaniya",
    title: "Матрица судьбы, Таро и Лила: три практики самопознания и чем они отличаются",
    primaryQuery: "практики для самопознания",
    cluster: "general",
    image: "/hero.webp",
    imageAlt: HERO_ALT,
    basis: ["arcana", "tarot", "lila-rules"],
    internalLinks: ["/matrica-sudby", "/taro", "/lila", "/sovmestimost"],
    status: "draft",
  },
];

export const nextDraftTopic = (plan: readonly PlanTopic[] = CONTENT_PLAN): PlanTopic | undefined => plan.find((topic) => topic.status === "draft");
