import { LILA_CONCLUSION_TITLES } from "@oracle/core";
import type { StoredConclusionChapter } from "@oracle/db";

export function ConclusionView({ chapters }: { chapters: readonly StoredConclusionChapter[] }) {
  return (
    <div className="stack lila-conclusion">
      {chapters.map((chapter) => (
        <section key={chapter.id} className="card stack" aria-labelledby={`conclusion-${chapter.id}`}>
          <h2 id={`conclusion-${chapter.id}`}>{LILA_CONCLUSION_TITLES[chapter.id]}</h2>
          {chapter.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
