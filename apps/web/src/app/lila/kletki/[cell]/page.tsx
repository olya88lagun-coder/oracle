import { lilaCellByNumber, LILA_CELLS } from "@oracle/content/lila";
import { LILA_ARROWS, LILA_SNAKES } from "@oracle/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Board } from "@/components/lila/Board";
import { CellArt } from "@/components/lila/CellArt";
import { lilaCellDescription, lilaCellFromParam, lilaCellJsonLd, lilaCellPath, lilaParam, LILA_GAME_PATH, LILA_PATH } from "@/lib/lila-paths";
import { publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { availableCellImages } from "@/server/lila-images";

type Params = { params: Promise<{ cell: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LILA_CELLS.map((cell) => ({ cell: lilaParam(cell) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const cell = lilaCellFromParam((await params).cell);
  if (!cell) return {};
  return publicMetadata({
    title: `Клетка ${cell.number} «${cell.name}» в игре Лила — значение`,
    description: lilaCellDescription(cell),
    path: lilaCellPath(cell),
  });
}

const neighbour = (number: number) => lilaCellByNumber(((number - 1 + LILA_CELLS.length) % LILA_CELLS.length) + 1);
const VISIT_LABELS = ["Первый визит", "Второй визит", "Третий и дальше"] as const;

export default async function LilaCellPage({ params }: Params) {
  const cell = lilaCellFromParam((await params).cell);
  if (!cell) notFound();
  const snakeTo = LILA_SNAKES[cell.number];
  const arrowTo = LILA_ARROWS[cell.number];
  const target = snakeTo ?? arrowTo;
  const previous = neighbour(cell.number - 1);
  const next = neighbour(cell.number + 1);
  const jsonLd = JSON.stringify(lilaCellJsonLd(cell, SITE_URL)).replace(/</g, "\\u003c");

  return (
    <main className="page page--wide stack lila-cell-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Навигация" className="muted">
        <Link className="touch-link" href={LILA_PATH}>
          Лила
        </Link>{" "}
        › Клетка {cell.number}
      </nav>
      <header className="lila-cell-page__hero">
        <CellArt cell={cell} size="page" available={availableCellImages()} priority />
        <div className="stack">
          <p className="eyebrow eyebrow--line">Клетка {cell.number}</p>
          <h1 className="display">{cell.name}</h1>
          <p className="lead">{cell.about}</p>
        </div>
      </header>

      <section className="card stack" aria-labelledby="questions">
        <h2 id="questions">Вопросы для размышления</h2>
        <ol>
          {cell.questions.map((question, index) => (
            <li key={question}>
              <span className="muted">{VISIT_LABELS[index]}: </span>
              {question}
            </li>
          ))}
        </ol>
      </section>

      {target !== undefined && cell.transition && (
        <section className="card stack" aria-labelledby="transition">
          <h2 id="transition">
            {snakeTo !== undefined ? "Змея" : "Стрела"}: {cell.number} → {target}
          </h2>
          <p>{cell.transition}</p>
          <p>
            <Link href={lilaCellPath(lilaCellByNumber(target))}>
              Клетка {target} «{lilaCellByNumber(target).name}»
            </Link>
          </p>
        </section>
      )}

      <Board current={cell.number} variant="locator" />

      <p className="row">
        <Link className="button button--lavender" href={LILA_GAME_PATH}>
          Играть
        </Link>
        <Link className="button button--ghost" href={lilaCellPath(previous)}>
          ← {previous.number} · {previous.name}
        </Link>
        <Link className="button button--ghost" href={lilaCellPath(next)}>
          {next.number} · {next.name} →
        </Link>
      </p>
    </main>
  );
}
