import { ARTICLES, type Article } from "@oracle/content/articles";
import { lilaCellByNumber } from "@oracle/content/lila";
import { lilaCellImage } from "./lila-paths";
import { SITE_URL } from "./site";

export const BLOG_PATH = "/blog";

export type BlogPost = {
  slug: string;
  // h1 страницы; заголовок для поиска и описание — отдельно, чтобы уложиться в длину сниппета
  title: string;
  metaTitle: string;
  description: string;
  published: string;
  image: { url: string; alt: string };
  topic: BlogTopic;
  // Приблизительное время чтения в минутах: русские слова видимого текста / 180, не меньше 1
  readingMinutes: number;
};

export type BlogTopic = "matrix" | "compat" | "lila" | "taro";
export const BLOG_TOPIC_LABELS: Readonly<Record<BlogTopic, string>> = { matrix: "Матрица", compat: "Совместимость", lila: "Лила", taro: "Таро" };
// Тема Markdown-статьи берётся из поля cluster; незнакомое значение попадает в «Матрицу»
const TOPIC_BY_CLUSTER: Readonly<Record<string, BlogTopic>> = { matrix: "matrix", compat: "compat", lila: "lila", taro: "taro" };

const WORDS_PER_MINUTE = 180;
export const readingMinutesFor = (wordCount: number): number => Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
export const countWords = (text: string): number => text.split(/\s+/).filter((word) => /[а-яёa-z0-9]/i.test(word)).length;

const cellPreview = (number: number) => {
  const cell = lilaCellByNumber(number);
  return { url: lilaCellImage(cell, "page"), alt: `Клетка ${cell.number} «${cell.name}» в игре Лила` };
};

const MANUAL_POSTS: readonly BlogPost[] = [
  {
    slug: "kak-igrat-v-lilu-onlain",
    title: "Как играть в Лилу онлайн: правила по шагам",
    metaTitle: "Как играть в Лилу онлайн — правила игры по шагам",
    description: "Как устроена Лила: намерение, кубик, шестёрка для входа, змеи и стрелы, 72 клетки и цель — клетка 68. Простые правила и советы новичку.",
    published: "2026-09-30",
    image: cellPreview(1),
    topic: "lila",
    readingMinutes: 3,
  },
  {
    slug: "zmei-i-strely-lily",
    title: "Змеи и стрелы Лилы: полный список и значение",
    metaTitle: "Змеи и стрелы Лилы — полный список переходов на поле",
    description: "Десять змей и десять стрел Лилы: откуда и куда ведёт каждая, что означает переход и как с ним работать. Список по номерам клеток.",
    published: "2026-09-30",
    image: cellPreview(12),
    topic: "lila",
    readingMinutes: 2,
  },
  {
    slug: "kak-sformulirovat-namerenie-dlya-lily",
    title: "Как сформулировать намерение для Лилы: примеры и советы",
    metaTitle: "Как сформулировать намерение для Лилы — примеры",
    description: "Как выбрать вопрос для игры в Лилу: чем хорошее намерение отличается от размытого, примеры формулировок для отношений, работы, денег и выбора.",
    published: "2026-09-30",
    image: cellPreview(68),
    topic: "lila",
    readingMinutes: 2,
  },
  {
    slug: "chto-takoe-matritsa-sudby",
    title: "Что такое матрица судьбы и как читать свою матрицу",
    metaTitle: "Что такое матрица судьбы — как читать и рассчитать по дате рождения",
    description: "Что такое матрица судьбы, как она строится по дате рождения, что значат личность, центр и задача, и почему это инструмент самопознания, а не предсказание.",
    published: "2026-09-30",
    image: { url: "/hero.webp", alt: "Матрица судьбы — символическая схема по дате рождения" },
    topic: "matrix",
    readingMinutes: 2,
  },
];

const articlePost = (article: Article): BlogPost => ({
  slug: article.slug,
  title: article.title,
  metaTitle: article.metaTitle,
  description: article.description,
  published: article.date,
  image: { url: article.image, alt: article.imageAlt },
  topic: TOPIC_BY_CLUSTER[article.cluster] ?? "matrix",
  readingMinutes: readingMinutesFor(countWords(`${article.body} ${article.faq.map((item) => `${item.question} ${item.answer}`).join(" ")}`)),
});

// Сначала новые; при одинаковой дате порядок объявления сохраняется (сортировка устойчива)
export const BLOG_POSTS: readonly BlogPost[] = [...MANUAL_POSTS, ...ARTICLES.map(articlePost)].sort((a, b) => b.published.localeCompare(a.published));

export function articleFaqJsonLd(article: Article): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

// Темы, в которых есть статьи, с числом материалов: пустую тему фильтр не показывает
export const blogTopics = (posts: readonly BlogPost[] = BLOG_POSTS): { topic: BlogTopic; label: string; count: number }[] =>
  (Object.keys(BLOG_TOPIC_LABELS) as BlogTopic[]).map((topic) => ({ topic, label: BLOG_TOPIC_LABELS[topic], count: posts.filter((post) => post.topic === topic).length })).filter((item) => item.count > 0);

// Связанные материалы: сначала той же темы, затем самые новые; саму статью не предлагаем
export const relatedPosts = (post: BlogPost, limit = 3): BlogPost[] => {
  const others = BLOG_POSTS.filter((item) => item.slug !== post.slug);
  return [...others.filter((item) => item.topic === post.topic), ...others.filter((item) => item.topic !== post.topic)].slice(0, limit);
};

export const blogPath = (post: Pick<BlogPost, "slug">): string => `${BLOG_PATH}/${post.slug}`;
export const blogPostBySlug = (slug: string): BlogPost | undefined => BLOG_POSTS.find((post) => post.slug === slug);

export function blogPostJsonLd(post: BlogPost): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    inLanguage: "ru",
    datePublished: post.published,
    dateModified: post.published,
    mainEntityOfPage: `${SITE_URL}${blogPath(post)}`,
    image: `${SITE_URL}${post.image.url}`,
    author: { "@type": "Organization", name: "Твой оракул", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Твой оракул", url: SITE_URL },
  };
}
