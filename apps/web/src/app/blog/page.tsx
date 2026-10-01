import type { Metadata } from "next";
import { BlogCatalog, type CatalogPost } from "@/components/blog/BlogCatalog";
import { BLOG_PATH, BLOG_POSTS, BLOG_TOPIC_LABELS, blogPath, blogTopics } from "@/lib/blog";
import { publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Блог о Лиле и матрице судьбы — Твой оракул",
  description: "Правила Лилы, значения змей и стрел, как формулировать намерение и читать матрицу судьбы: спокойные разборы для самопознания.",
  path: BLOG_PATH,
  absoluteTitle: true,
  image: SITE_PREVIEW_IMAGE,
});

const dateLabel = (iso: string) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

// Главный материал каталога выбирается явно, а не по порядку: у статей одной даты порядок случайный
const FEATURED_SLUG = "rasshifrovka-matritsy-sudby";
const ORDERED_POSTS = [...BLOG_POSTS].sort((a, b) => Number(b.slug === FEATURED_SLUG) - Number(a.slug === FEATURED_SLUG));

export default function BlogIndexPage() {
  const posts: CatalogPost[] = ORDERED_POSTS.map((post) => ({
    slug: post.slug,
    path: blogPath(post),
    title: post.title,
    description: post.description,
    published: post.published,
    dateLabel: dateLabel(post.published),
    topic: post.topic,
    topicLabel: BLOG_TOPIC_LABELS[post.topic],
    readingMinutes: post.readingMinutes,
    imageUrl: post.image.url,
    imageAlt: post.image.alt,
  }));
  return (
    <main className="blog-page">
      <header className="matrix-wrap blog-head">
        <h1 className="display">Блог</h1>
        <p className="lead">Как играть в Лилу, читать матрицу судьбы и находить собственный смысл в символических практиках.</p>
      </header>
      <BlogCatalog posts={posts} topics={blogTopics()} />
    </main>
  );
}
