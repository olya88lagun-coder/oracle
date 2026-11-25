"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BlogTopic } from "@/lib/blog";

export type CatalogPost = {
  slug: string;
  path: string;
  title: string;
  description: string;
  dateLabel: string;
  published: string;
  topic: BlogTopic;
  topicLabel: string;
  readingMinutes: number;
  imageUrl: string;
  imageAlt: string;
};
export type CatalogTopic = { topic: BlogTopic; label: string; count: number };

type Filter = "all" | BlogTopic;

const PAGE_SIZE = 9;

const countWord = (count: number): string => {
  const last = count % 10;
  const tens = count % 100;
  return `${count} ${tens >= 11 && tens <= 14 ? "материалов" : last === 1 ? "материал" : last >= 2 && last <= 4 ? "материала" : "материалов"}`;
};

function Meta({ post }: { post: CatalogPost }) {
  return (
    <p className="blog-meta">
      <span className="blog-meta__topic">{post.topicLabel}</span>
      <time dateTime={post.published}>{post.dateLabel}</time>
      <span>≈ {post.readingMinutes} мин</span>
    </p>
  );
}

// Каталог блога: свежий главный материал, фильтр-чипы и сетка с «показать ещё»
export function BlogCatalog({ posts, topics }: { posts: readonly CatalogPost[]; topics: readonly CatalogTopic[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [lead, ...rest] = posts;

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("topic");
    if (topics.some((item) => item.topic === fromUrl)) setFilter(fromUrl as BlogTopic);
  }, [topics]);

  function choose(next: Filter) {
    setFilter(next);
    setVisible(PAGE_SIZE);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("topic");
    else url.searchParams.set("topic", next);
    try {
      window.history.replaceState(null, "", url);
    } catch {
      // Адрес не обновится — фильтр работает и так
    }
  }

  const matches = (post: CatalogPost) => filter === "all" || post.topic === filter;
  const filteredRest = useMemo(() => rest.filter((post) => filter === "all" || post.topic === filter), [rest, filter]);
  const total = posts.filter(matches).length;
  const shown = filteredRest.slice(0, visible);
  const hasMore = filteredRest.length > visible;
  if (!lead) return null;

  return (
    <>
      <section className="blog-lead" aria-labelledby="blog-lead-title" hidden={!matches(lead)}>
        <div className="blog-lead__art">
          <Image src={lead.imageUrl} alt="" fill priority unoptimized sizes="100vw" />
        </div>
        <div className="matrix-wrap blog-lead__inner">
          <div className="blog-lead__copy">
            <p className="blog-lead__eyebrow">Свежий материал</p>
            <Meta post={lead} />
            <h2 id="blog-lead-title">
              <Link href={lead.path}>{lead.title}</Link>
            </h2>
            <p>{lead.description}</p>
            <Link className="matrix-link" href={lead.path}>
              Читать статью
            </Link>
          </div>
        </div>
      </section>

      <section className="matrix-wrap blog-cat" aria-label="Все материалы">
        <div className="blog-filters-row">
          <div className="blog-filters" role="group" aria-label="Тема">
            <button type="button" aria-pressed={filter === "all"} onClick={() => choose("all")}>
              Все материалы <b>{posts.length}</b>
            </button>
            {topics.map((item) => (
              <button key={item.topic} type="button" aria-pressed={filter === item.topic} onClick={() => choose(item.topic)}>
                {item.label} <b>{item.count}</b>
              </button>
            ))}
          </div>
          <p role="status" aria-live="polite" aria-atomic="true">
            {countWord(total)}
          </p>
        </div>

        <ul className="blog-grid">
          {shown.map((post) => (
            <li key={post.slug}>
              <Link href={post.path} className="blog-card">
                <span className="blog-card__art">
                  <Image
                    src={post.imageUrl}
                    alt=""
                    fill
                    unoptimized
                    loading="lazy"
                    sizes="(min-width: 1100px) 360px, (min-width: 860px) 45vw, 100vw"
                  />
                </span>
                <Meta post={post} />
                <span className="blog-card__title">{post.title}</span>
                <span className="blog-card__text">{post.description}</span>
                <span className="blog-card__more">Читать статью</span>
              </Link>
            </li>
          ))}
        </ul>

        {hasMore ? (
          <div className="blog-more">
            <button type="button" className="button button--ghost" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
              Показать ещё
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
