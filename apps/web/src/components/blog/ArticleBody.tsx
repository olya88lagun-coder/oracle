import { ARTICLE_BASIS, parseMarkdown, type Article, type Inline } from "@oracle/content/articles";
import Link from "next/link";
import { Fragment } from "react";

function Inlines({ items }: { items: readonly Inline[] }) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={index}>
          {item.type === "strong" ? <strong>{item.text}</strong> : item.type === "link" ? <Link href={item.href}>{item.text}</Link> : item.text}
        </Fragment>
      ))}
    </>
  );
}

// Тело Markdown-статьи: текст, вопросы и ответы, блок «На чём основана статья»
export function ArticleBody({ article }: { article: Article }) {
  return (
    <>
      {parseMarkdown(article.body).map((block, index) =>
        block.type === "h2" ? (
          <h2 key={index}>{block.text}</h2>
        ) : block.type === "ul" ? (
          <ul key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Inlines items={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>
            <Inlines items={block.inlines} />
          </p>
        ),
      )}
      <section className="stack">
        <h2>Частые вопросы</h2>
        {article.faq.map((item) => (
          <div key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>
      <aside className="stack muted">
        <h2>На чём основана статья</h2>
        <ul>
          {article.basis.map((key) => (
            <li key={key}>{ARTICLE_BASIS[key].label}</li>
          ))}
        </ul>
      </aside>
    </>
  );
}
