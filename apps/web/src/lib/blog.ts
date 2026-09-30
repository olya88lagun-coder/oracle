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
};

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
  },
  {
    slug: "zmei-i-strely-lily",
    title: "Змеи и стрелы Лилы: полный список и значение",
    metaTitle: "Змеи и стрелы Лилы — полный список переходов на поле",
    description: "Десять змей и десять стрел Лилы: откуда и куда ведёт каждая, что означает переход и как с ним работать. Список по номерам клеток.",
    published: "2026-09-30",
    image: cellPreview(12),
  },
  {
    slug: "kak-sformulirovat-namerenie-dlya-lily",
    title: "Как сформулировать намерение для Лилы: примеры и советы",
    metaTitle: "Как сформулировать намерение для Лилы — примеры",
    description: "Как выбрать вопрос для игры в Лилу: чем хорошее намерение отличается от размытого, примеры формулировок для отношений, работы, денег и выбора.",
    published: "2026-09-30",
    image: cellPreview(68),
  },
  {
    slug: "chto-takoe-matritsa-sudby",
    title: "Что такое матрица судьбы и как читать свою матрицу",
    metaTitle: "Что такое матрица судьбы — как читать и рассчитать по дате рождения",
    description: "Что такое матрица судьбы, как она строится по дате рождения, что значат личность, центр и задача, и почему это инструмент самопознания, а не предсказание.",
    published: "2026-09-30",
    image: { url: "/hero.webp", alt: "Матрица судьбы — символическая схема по дате рождения" },
  },
];

const articlePost = (article: Article): BlogPost => ({
  slug: article.slug,
  title: article.title,
  metaTitle: article.metaTitle,
  description: article.description,
  published: article.date,
  image: { url: article.image, alt: article.imageAlt },
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
