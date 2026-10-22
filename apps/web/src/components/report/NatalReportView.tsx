import { NATAL_CHAPTER_IDS, NATAL_CHAPTER_TITLES, natalChapterOutline, type NatalChapterOutline } from "@oracle/core/natal-report";
import type { NatalChart } from "@oracle/core/natal";
import type { StoredNatalChapter } from "@oracle/db";
import Link from "next/link";
import { NatalGlyph, bodyGlyphId } from "@/components/natal/NatalGlyph";
import { NatalSprite } from "@/components/natal/NatalSprite";
import { NatalWheel, type NatalBirth } from "@/components/natal/NatalWheel";
import { DISCLAIMER } from "@/lib/legal";
import { EXAMPLE_CALCULATE, EXAMPLE_NOTE, EXAMPLE_TITLE, REPORT_PAGE_LEAD, REPORT_PAGE_TITLE, sunMoonAscSummary } from "@/lib/natal-copy";
import { NATAL_PATH } from "@/lib/natal-paths";
import { housesLabel, pointLabel } from "@/lib/natal-report-offer";
import { formatIsoDate } from "@/lib/report-offer";
import { Scenario } from "./ReportView";

// Карта и данные рождения для обложки и положений в главах. Без них (данные рождения стёрты после удаления данных) разбор показывается только текстом
export type NatalReportChart = { chart: NatalChart; birth: NatalBirth };

// Положения, о которых глава: планеты в знаках и домах, затем дома без планет. У глав про аспекты и сценарий их нет
function placementsOf(outline: NatalChapterOutline | undefined): { key: string; glyph: string | null; label: string }[] {
  if (!outline) return [];
  const points = outline.points.map((point) => ({ key: point.body, glyph: point.body === "ascendant" ? null : bodyGlyphId(point.body), label: pointLabel(point) }));
  return outline.houses.length > 0 ? [...points, { key: "houses", glyph: null, label: housesLabel(outline.houses) }] : points;
}

function outlineOf(chart: NatalChart | undefined): NatalChapterOutline[] {
  if (!chart?.timeKnown) return [];
  try {
    return natalChapterOutline(chart);
  } catch {
    return [];
  }
}

// Готовый разбор натальной карты: обложка с колесом, оглавление, девять глав, поля сценария и дисклеймер.
// Главы идут в порядке оглавления; глава, которой почему-то нет, пропускается.
// Классы natal-report__*: cover, wheel, big-three, placements, lead (первый абзац главы), takeaway (последний абзац, если абзацев три и больше), scenario
export function NatalReportView({ chapters, date, placeName, demo = false, chartData }: { chapters: readonly StoredNatalChapter[]; date: string; placeName: string | null; demo?: boolean; chartData?: NatalReportChart | null }) {
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const ordered = NATAL_CHAPTER_IDS.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const outlines = new Map(outlineOf(chartData?.chart).map((outline) => [outline.id, outline]));
  const summary = chartData ? sunMoonAscSummary(chartData.chart) : null;
  return (
    <article className="report natal-report stack">
      <header className="stack natal-report__head">
        <p className="eyebrow">
          {demo ? `Демонстрационные данные: ${formatIsoDate(date)}` : `${REPORT_PAGE_TITLE} · по дате ${formatIsoDate(date)}`}
          {placeName ? `, ${placeName}` : ""}
        </p>
        <h1 className="display">{demo ? EXAMPLE_TITLE : REPORT_PAGE_TITLE}</h1>
        <p className="lead">{REPORT_PAGE_LEAD}</p>
        {demo && <p className="muted">{EXAMPLE_NOTE}</p>}
        {chartData && summary && (
          <div className="natal-report__cover">
            <NatalSprite />
            <div className="natal-report__wheel">
              <NatalWheel chart={chartData.chart} birth={chartData.birth} />
            </div>
            <div className="natal-summary natal-report__big-three" role="group" aria-label="Главные положения карты">
              <div className="natal-summary__item natal-report__big-three-item">
                <NatalGlyph id="sun" />
                <span>{summary.sun}</span>
              </div>
              <div className="natal-summary__item natal-report__big-three-item">
                <NatalGlyph id="moon" />
                <span>{summary.moon}</span>
              </div>
              {chartData.chart.timeKnown && chartData.chart.ascendant && (
                <div className="natal-summary__item natal-report__big-three-item">
                  <span className="natal-summary__axis" aria-hidden="true">
                    AC
                  </span>
                  <span>{summary.ascendant}</span>
                </div>
              )}
            </div>
          </div>
        )}
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

      {ordered.map((chapter, index) => {
        const placements = placementsOf(outlines.get(chapter.id));
        const paragraphs = chapter.paragraphs ?? [];
        const lastIndex = paragraphs.length - 1;
        return (
          <section key={chapter.id} id={`natal-chapter-${chapter.id}`} className="report-chapter natal-report__chapter stack" aria-labelledby={`natal-chapter-${chapter.id}-title`}>
            <p className="eyebrow">Глава {index + 1}</p>
            <h2 id={`natal-chapter-${chapter.id}-title`}>{NATAL_CHAPTER_TITLES[chapter.id]}</h2>
            {placements.length > 0 && (
              <ul className="natal-report__placements" aria-label="Положения в этой главе">
                {placements.map((placement) => (
                  <li key={placement.key} className="natal-report__placement">
                    {placement.glyph && <NatalGlyph id={placement.glyph} />}
                    <span>{placement.label}</span>
                  </li>
                ))}
              </ul>
            )}
            {paragraphs.map((paragraph, position) => (
              <p key={position} className={["report-text", position === 0 && "natal-report__lead", lastIndex >= 2 && position === lastIndex && "natal-report__takeaway"].filter(Boolean).join(" ")}>
                {paragraph}
              </p>
            ))}
            {chapter.scenario && (
              <div className="natal-report__scenario">
                <Scenario chapter={chapter} />
              </div>
            )}
          </section>
        );
      })}

      <p className="muted">{DISCLAIMER}</p>
      <p>{demo ? <Link href={NATAL_PATH}>{EXAMPLE_CALCULATE}</Link> : <Link href="/portret">← Мой портрет</Link>}</p>
    </article>
  );
}
