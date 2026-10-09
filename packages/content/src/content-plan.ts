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
    status: "draft",
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
    status: "draft",
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
    status: "draft",
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
    status: "draft",
  },
];

export const nextDraftTopic = (plan: readonly PlanTopic[] = CONTENT_PLAN): PlanTopic | undefined => plan.find((topic) => topic.status === "draft");
