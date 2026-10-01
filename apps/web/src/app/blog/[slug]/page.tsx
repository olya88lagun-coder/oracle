import { articleBySlug } from "@oracle/content/articles";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { ArticleToc } from "@/components/blog/ArticleToc";
import { HowToPlayLila } from "@/components/blog/HowToPlayLila";
import { LilaIntention } from "@/components/blog/LilaIntention";
import { LilaSnakesArrows } from "@/components/blog/LilaSnakesArrows";
import { WhatIsMatrix } from "@/components/blog/WhatIsMatrix";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { COMPAT_PATH } from "@/lib/compat";
import { LILA_PATH } from "@/lib/lila-paths";
import { TARO_PATH } from "@/lib/taro-paths";
import { articleFaqJsonLd, BLOG_PATH, BLOG_POSTS, BLOG_TOPIC_LABELS, blogPath, blogPostBySlug, blogPostJsonLd, relatedPosts } from "@/lib/blog";
import { DISCLAIMER } from "@/lib/legal";
import { jsonLdScript, publicMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

const BODIES: Readonly<Record<string, () => ReactNode>> = {
  "kak-igrat-v-lilu-onlain": HowToPlayLila,
  "zmei-i-strely-lily": LilaSnakesArrows,
  "kak-sformulirovat-namerenie-dlya-lily": LilaIntention,
  "chto-takoe-matritsa-sudby": WhatIsMatrix,
};

const TEXT_ID = "article-text";

// Куда вести читателя после статьи: практика по теме
const PRACTICE_BY_TOPIC = {
  matrix: { href: MATRIX_PATH, title: "Матрица судьбы", text: "Введите дату рождения и посмотрите свою диаграмму: бесплатно и без регистрации." },
  compat: { href: COMPAT_PATH, title: "Совместимость", text: "Две даты — один общий аркан. Расчёт делается в вашем браузере." },
  lila: { href: LILA_PATH, title: "Лила", text: "Сформулируйте намерение и пройдите путь по полю из 72 клеток." },
  taro: { href: TARO_PATH, title: "Таро и карта дня", text: "Одна карта на сегодня: образ, действие и вопрос для себя." },
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = blogPostBySlug((await params).slug);
  if (!post) return {};
  return publicMetadata({ title: post.metaTitle, description: post.description, path: blogPath(post), image: post.image });
}

const dateLabel = (iso: string) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" }).format(new Date(iso));

export default async function BlogPostPage({ params }: Params) {
  const post = blogPostBySlug((await params).slug);
  const article = post ? articleBySlug(post.slug) : undefined;
  const Body = post ? BODIES[post.slug] : undefined;
  const content = Body ? <Body /> : article ? <ArticleBody article={article} /> : null;
  if (!post || !content) notFound();
  const related = relatedPosts(post);
  return (
    <main className="blog-article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(blogPostJsonLd(post)) }} />
      {article && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(articleFaqJsonLd(article)) }} />}
      <article>
        <header className="blog-article-head">
          <Link className="blog-back" href={BLOG_PATH}>
            <span aria-hidden="true">←</span> Блог
          </Link>
          <p className="blog-meta">
            <span className="blog-meta__topic">{BLOG_TOPIC_LABELS[post.topic]}</span>
            <time dateTime={post.published}>{dateLabel(post.published)}</time>
            <span>≈ {post.readingMinutes} мин</span>
          </p>
          <h1 className="display">{post.title}</h1>
          <p className="blog-article-head__lead">{post.description}</p>
          <p className="blog-article-head__author">Твой оракул</p>
        </header>

        <div className="blog-cover">
          <Image src={post.image.url} alt={post.image.alt} fill priority unoptimized sizes="(min-width: 1100px) 1060px, 100vw" />
        </div>

        <div className="blog-article-layout">
          <ArticleToc targetId={TEXT_ID} />
          <div id={TEXT_ID} className="blog-prose stack">
            {content}
            <p className="blog-disclaimer">{DISCLAIMER}</p>
          </div>
        </div>
        <aside className="blog-practice" aria-label="Практика по теме статьи">
          <p className="blog-practice__label">Практика по теме</p>
          <h2>{PRACTICE_BY_TOPIC[post.topic].title}</h2>
          <p>{PRACTICE_BY_TOPIC[post.topic].text}</p>
          <Link className="matrix-link" href={PRACTICE_BY_TOPIC[post.topic].href}>
            Перейти
          </Link>
        </aside>
      </article>

      {related.length > 0 && (
        <section className="blog-related" aria-labelledby="blog-related">
          <h2 id="blog-related">Читайте дальше</h2>
          <ul>
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={blogPath(item)}>
                  <span className="blog-meta__topic">{BLOG_TOPIC_LABELS[item.topic]}</span>
                  <span className="blog-related__title">{item.title}</span>
                  <span className="blog-related__more">≈ {item.readingMinutes} мин</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
