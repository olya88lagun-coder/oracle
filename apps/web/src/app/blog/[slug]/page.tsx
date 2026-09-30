import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { HowToPlayLila } from "@/components/blog/HowToPlayLila";
import { LilaIntention } from "@/components/blog/LilaIntention";
import { LilaSnakesArrows } from "@/components/blog/LilaSnakesArrows";
import { WhatIsMatrix } from "@/components/blog/WhatIsMatrix";
import { BLOG_PATH, BLOG_POSTS, blogPath, blogPostBySlug, blogPostJsonLd } from "@/lib/blog";
import { DISCLAIMER } from "@/lib/legal";
import { jsonLdScript, publicMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

const BODIES: Readonly<Record<string, () => ReactNode>> = {
  "kak-igrat-v-lilu-onlain": HowToPlayLila,
  "zmei-i-strely-lily": LilaSnakesArrows,
  "kak-sformulirovat-namerenie-dlya-lily": LilaIntention,
  "chto-takoe-matritsa-sudby": WhatIsMatrix,
};

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
  const Body = post ? BODIES[post.slug] : undefined;
  if (!post || !Body) notFound();
  return (
    <main className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(blogPostJsonLd(post)) }} />
      <article className="stack blog-article">
        <nav aria-label="Навигация" className="muted">
          <Link className="touch-link" href={BLOG_PATH}>
            Блог
          </Link>{" "}
          › {post.title}
        </nav>
        <h1 className="display">{post.title}</h1>
        <p className="muted">
          <time dateTime={post.published}>{dateLabel(post.published)}</time>
        </p>
        <Body />
        <p className="muted">{DISCLAIMER}</p>
      </article>
    </main>
  );
}
