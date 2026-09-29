import { CHAPTER_TITLES, reportChapters, SCENARIO_FIELDS, SCENARIO_TITLES, type Matrix } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import type { StoredChapter } from "@oracle/db";
import Image from "next/image";
import Link from "next/link";
import { arcanumImage, arcanumPath } from "@/lib/arcana-paths";
import { DISCLAIMER } from "@/lib/legal";
import { chapterAnchor, chapterArcanaLabel, formatIsoDate, orderedChapters } from "@/lib/report-offer";
import { ReportPdfLink } from "./ReportPdfLink";

type Props = { matrix: Matrix; birthDate: string; chapters: readonly StoredChapter[]; purchaseId: string };

const HIGHLIGHTED = new Set(["turningPoint", "experiment"]);

function Scenario({ chapter }: { chapter: StoredChapter }) {
  if (!chapter.scenario) return null;
  return (
    <div className="report-scenario">
      {SCENARIO_FIELDS.map((field) => (
        <div key={field} className={`card stack report-scenario__item${HIGHLIGHTED.has(field) ? " card--accent" : ""}${field === "question" ? " report-scenario__item--question" : ""}`}>
          <h3>{SCENARIO_TITLES[field]}</h3>
          <p className={field === "question" ? "report-question" : undefined}>{chapter.scenario![field]}</p>
        </div>
      ))}
    </div>
  );
}

export function ReportView({ matrix, birthDate, chapters, purchaseId }: Props) {
  const center = arcanumByNumber(matrix.E);
  const toc = reportChapters(matrix);
  const arcanaOf = new Map(toc.map((chapter) => [chapter.id, chapter.arcana]));
  return (
    <article className="report stack">
      <header className="report-cover">
        <Image className="report-cover__art" src={arcanumImage(center)} alt="" width={960} height={960} sizes="(min-width: 960px) 420px, 100vw" priority unoptimized />
        <div className="stack">
          <p className="eyebrow">Разбор матрицы судьбы · по дате {formatIsoDate(birthDate)}</p>
          <h1 className="display report-cover__title">Ваш центр — {center.name}</h1>
          <p className="lead">Семь глав о том, как устроена ваша матрица. Это материал для размышления, а не предсказание.</p>
          <p>
            <ReportPdfLink purchaseId={purchaseId} />
          </p>
          <nav className="card report-contents" aria-labelledby="report-contents">
            <h2 id="report-contents">Оглавление</h2>
            <ol className="report-toc">
              {toc.map((chapter, index) => (
                <li key={chapter.id}>
                  <span className="report-toc__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <a className="report-toc__title" href={`#${chapterAnchor(chapter.id)}`}>
                    {chapter.title}
                  </a>
                  <span className="report-toc__arcana">{chapterArcanaLabel(chapter)}</span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      {orderedChapters(chapters).map((chapter) => {
        const number = toc.findIndex((item) => item.id === chapter.id) + 1;
        const arcana = chapter.id === "scenario" ? [] : (arcanaOf.get(chapter.id) ?? []);
        return (
          <section key={chapter.id} id={chapterAnchor(chapter.id)} className="report-chapter stack" aria-labelledby={`${chapterAnchor(chapter.id)}-title`}>
            <p className="eyebrow">Глава {number}</p>
            <h2 id={`${chapterAnchor(chapter.id)}-title`}>{CHAPTER_TITLES[chapter.id]}</h2>
            {arcana.length > 0 && (
              <ul className="report-chapter__arcana" aria-label="Арканы главы">
                {arcana.map((value, index) => {
                  const arcanum = arcanumByNumber(value);
                  return (
                    <li key={`${value}-${index}`}>
                      <Link className="tag report-tag" href={arcanumPath(arcanum)}>
                        {arcanum.number} {arcanum.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {chapter.paragraphs?.map((paragraph, index) => (
              <p key={index} className="report-text">
                {paragraph}
              </p>
            ))}
            <Scenario chapter={chapter} />
          </section>
        );
      })}

      <p className="muted">{DISCLAIMER}</p>
      <p>
        <Link href="/portret">← Мой портрет</Link>
      </p>
    </article>
  );
}
