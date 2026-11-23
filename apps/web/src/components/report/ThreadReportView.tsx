import { calculateLifeThread, THREAD_CHAPTER_IDS, THREAD_CHAPTER_TITLES } from "@oracle/core";
import type { StoredThreadChapter } from "@oracle/db";
import Link from "next/link";
import "@/app/numerologiya/grafik-sudby/thread.css";
import { ThreadChart } from "@/components/numerology/ThreadChart";
import { ReportPdfLink } from "@/components/report/ReportPdfLink";
import { DISCLAIMER } from "@/lib/legal";
import { THREAD_REPORT_TITLE } from "@/lib/thread-copy";

// today нужен примеру: у него «сегодня» заморожено, чтобы картинка не менялась со временем.
// Готовый разбор нити: картинка на всю жизнь, оглавление и главы в порядке THREAD_CHAPTER_IDS. Главы, которых нет в хранилище, пропускаются.
// purchaseId — готовый разбор покупателя: кнопка «Скачать PDF»; без него (пример) ведёт на готовый файл примера
export function ThreadReportView({ chapters, birthDate, today, purchaseId }: { chapters: readonly StoredThreadChapter[]; birthDate: string; today?: Date; purchaseId?: string }) {
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const ordered = THREAD_CHAPTER_IDS.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const thread = calculateLifeThread(birthDate, today ?? new Date());
  return (
    <article className="report thread-report stack">
      <header className="stack">
        <h1 className="display">{THREAD_REPORT_TITLE}</h1>
        <p>
          {purchaseId ? <ReportPdfLink purchaseId={purchaseId} /> : <a className="button button--ghost report-pdf" href="/examples/thread.pdf" download>Скачать пример PDF</a>}
        </p>
        {thread && <ThreadChart thread={thread} initialMode="all" />}
        {ordered.length > 0 && (
          <nav className="card report-contents thread-report__contents" aria-labelledby="thread-report-contents">
            <h2 id="thread-report-contents">Оглавление</h2>
            <ol className="report-toc">
              {ordered.map((chapter, index) => (
                <li key={chapter.id}>
                  <span className="report-toc__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <a className="report-toc__title thread-report__toc-link" href={`#thread-chapter-${chapter.id}`}>
                    {THREAD_CHAPTER_TITLES[chapter.id]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </header>

      {ordered.map((chapter, index) => (
        <section key={chapter.id} id={`thread-chapter-${chapter.id}`} className="report-chapter thread-report__chapter stack" aria-labelledby={`thread-chapter-${chapter.id}-title`}>
          <p className="eyebrow">Глава {index + 1}</p>
          <h2 id={`thread-chapter-${chapter.id}-title`}>{THREAD_CHAPTER_TITLES[chapter.id]}</h2>
          {chapter.blocks.map((block, position) => (
            <div key={position} className="thread-report__block stack">
              {block.heading && <h3>{block.heading}</h3>}
              {block.paragraphs.map((paragraph, i) => (
                <p key={i} className="report-text">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </section>
      ))}

      <p className="muted">{DISCLAIMER}</p>
      <p>
        <Link className="thread-report__back" href="/portret">← Мой портрет</Link>
      </p>
    </article>
  );
}
