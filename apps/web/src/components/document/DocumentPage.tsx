import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { OPERATOR } from "@/lib/legal";
import { jsonLdScript } from "@/lib/seo";
import { DocumentToc } from "./DocumentToc";

// Общая рамка четырёх документов сайта. Тексты остаются в самих страницах — здесь только вёрстка, навигация и оглавление
const DOCUMENTS = [
  { href: "/contacts", label: "Контакты" },
  { href: "/privacy", label: "Политика обработки данных" },
  { href: "/oferta", label: "Оферта" },
  { href: "/consent", label: "Согласие" },
] as const;

export type DocumentSection = { title: string; body: ReactNode; className?: string };
type Props = {
  current?: (typeof DOCUMENTS)[number]["href"];
  title: string;
  // Редакция и дата — строка под заголовком
  version?: ReactNode;
  intro?: ReactNode;
  sections: readonly DocumentSection[];
  // Замечание в конце документа (дисклеймер, ссылка на согласие)
  footnote?: ReactNode;
  wide?: boolean;
  // Разметка schema.org страницы, если она есть
  jsonLd?: Record<string, unknown>;
};

const sectionId = (index: number) => `section-${index + 1}`;

export function DocumentPage({ current, title, version, intro, sections, footnote, wide = false, jsonLd }: Props) {
  const items = sections.map((section, index) => ({ id: sectionId(index), title: section.title }));
  return (
    <main id="document-main" className={wide ? "document-main contacts-page" : "document-main"}>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />}
      <div className="matrix-wrap">
        <nav className="document-nav" aria-label="Контакты и документы">
          {DOCUMENTS.map((document) => (
            <Link key={document.href} href={document.href} aria-current={document.href === current ? "page" : undefined}>
              {document.label}
            </Link>
          ))}
        </nav>
        <div className="document-layout">
          <DocumentToc items={items} email={OPERATOR.email} />
          <article className="source-content">
            <header className="document-heading">
              <h1>{title}</h1>
              {version && <p className="muted">{version}</p>}
              {intro}
            </header>
            <DocumentBody sections={sections} />
            {footnote && <div className="document-footnote">{footnote}</div>}
            <a className="back-top" href="#document-main">
              К началу
              <Icon name="arrow-up" size={18} />
            </a>
          </article>
        </div>
      </div>
    </main>
  );
}

function DocumentBody({ sections }: { sections: readonly DocumentSection[] }) {
  return (
    <>
      {sections.map((section, index) => (
        <section key={section.title} className={["document-section", section.className].filter(Boolean).join(" ")} aria-labelledby={sectionId(index)}>
          <h2 id={sectionId(index)}>{section.title}</h2>
          {section.body}
        </section>
      ))}
    </>
  );
}
