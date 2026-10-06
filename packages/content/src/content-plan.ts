import type { ArticleBasisKey } from "./article-basis";

export type PlanTopic = {
  readonly slug: string;
  readonly title: string;
  // запрос, на который первый абзац статьи отвечает сразу
  readonly primaryQuery: string;
  readonly cluster: "matrix" | "compat" | "lila" | "general";
  // картинка: /hero.webp, /arcana/NN-slug.webp или /lila/NN-slug.webp
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
    status: "draft",
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
    status: "draft",
  },
  {
    slug: "pole-igry-lila",
    title: "Поле игры Лила: как устроены 72 клетки, змеи и стрелы",
    primaryQuery: "лила поле игры",
    cluster: "lila",
    image: "/lila/12-zavist.webp",
    imageAlt: "Клетка 12 «Зависть» в игре Лила",
    basis: ["lila-rules", "lila-cells"],
    internalLinks: ["/lila", "/blog/zmei-i-strely-lily", "/lila/kletki/12-zavist"],
    status: "draft",
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
    status: "draft",
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
    status: "draft",
  },
  {
    slug: "liniya-deneg-v-matritse-sudby",
    title: "Линия денег в матрице судьбы: как её читать",
    primaryQuery: "линия денег в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/03-imperatrica.webp",
    imageAlt: "Аркан 3 «Императрица» — образ созидания",
    basis: ["positions", "arcana"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-3-imperatrica"],
    status: "draft",
  },
  {
    slug: "matritsa-sudby-ne-predskazanie",
    title: "Матрица судьбы — инструмент самопознания, а не предсказание",
    primaryQuery: "матрица судьбы правда или нет",
    cluster: "general",
    image: "/hero.webp",
    imageAlt: HERO_ALT,
    basis: ["positions", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/lila", "/blog/chto-takoe-matritsa-sudby"],
    status: "draft",
  },
  {
    slug: "kak-obsudit-sovmestimost-s-partnerom",
    title: "Как обсудить результат совместимости с партнёром",
    primaryQuery: "как обсудить совместимость с партнёром",
    cluster: "compat",
    image: "/arcana/06-vlyublennye.webp",
    imageAlt: "Аркан 6 «Влюблённые» — образ выбора и близости",
    basis: ["compat-texts"],
    internalLinks: ["/sovmestimost", "/matrica-sudby/arkan-6-vlyublennye"],
    status: "draft",
  },
];

export const nextDraftTopic = (plan: readonly PlanTopic[] = CONTENT_PLAN): PlanTopic | undefined => plan.find((topic) => topic.status === "draft");
