import { NATAL_CHAPTER_IDS, NATAL_CHAPTER_TITLES } from "@oracle/core/natal-report";
import type { StoredNatalChapter } from "@oracle/db";
import Link from "next/link";
import { DISCLAIMER } from "@/lib/legal";
import { REPORT_PAGE_LEAD, REPORT_PAGE_TITLE } from "@/lib/natal-copy";
import { formatIsoDate } from "@/lib/report-offer";
import { Scenario } from "./ReportView";

// Готовый разбор натальной карты: оглавление, девять глав, поля сценария и дисклеймер.
// Главы идут в порядке оглавления; глава, которой почему-то нет, пропускается
export function NatalReportView({ chapters, date, placeName }: { chapters: readonly StoredNatalChapter[]; date: string; placeName: string | null }) {
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const ordered = NATAL_CHAPTER_IDS.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  return (
    <article className="report natal-report stack">
      <header className="stack natal-report__head">
        <p className="eyebrow">
          {REPORT_PAGE_TITLE} · по дате {formatIsoDate(date)}
          {placeName ? `, ${placeName}` : ""}
        </p>
        <h1 className="display">{REPORT_PAGE_TITLE}</h1>
        <p className="lead">{REPORT_PAGE_LEAD}</p>
        <nav className="card report-contents" aria-labelledby="natal-report-contents">
          <h2 id="natal-report-contents">Оглавление</h2>
          <ol className="report-toc">
            {ordered.map((chapter, index) => (
              <li key={chapter.id}>
                <span className="report-toc__number" aria-hidden="true">
                  {index + 1}
                </span>
                <a className="report-toc__title" href={`#natal-chapter-${chapter.id}`}>
                  {NATAL_CHAPTER_TITLES[chapter.id]}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      {ordered.map((chapter, index) => (
        <section key={chapter.id} id={`natal-chapter-${chapter.id}`} className="report-chapter stack" aria-labelledby={`natal-chapter-${chapter.id}-title`}>
          <p className="eyebrow">Глава {index + 1}</p>
          <h2 id={`natal-chapter-${chapter.id}-title`}>{NATAL_CHAPTER_TITLES[chapter.id]}</h2>
          {chapter.paragraphs?.map((paragraph, position) => (
            <p key={position} className="report-text">
              {paragraph}
            </p>
          ))}
          <Scenario chapter={chapter} />
        </section>
      ))}

      <p className="muted">{DISCLAIMER}</p>
      <p>
        <Link href="/portret">← Мой портрет</Link>
      </p>
    </article>
  );
}
