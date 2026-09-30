import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_PATH, BLOG_POSTS, blogPath } from "@/lib/blog";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Блог о Лиле и матрице судьбы — Твой оракул",
  description: "Правила Лилы, значения змей и стрел, как формулировать намерение и читать матрицу судьбы: спокойные разборы для самопознания.",
  path: BLOG_PATH,
  absoluteTitle: true,
});

export default function BlogIndexPage() {
  return (
    <main className="page stack">
      <h1 className="display">Блог</h1>
      <p className="lead">Как играть в Лилу, что значат змеи и стрелы, как сформулировать намерение и читать матрицу судьбы.</p>
      <ul className="stack blog-list">
        {BLOG_POSTS.map((post) => (
          <li key={post.slug} className="card stack">
            <h2>
              <Link href={blogPath(post)}>{post.title}</Link>
            </h2>
            <p>{post.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
