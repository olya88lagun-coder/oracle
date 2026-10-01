import { lilaCellByNumber, LILA_CELLS } from "@oracle/content/lila";
import { LILA_ARROWS, LILA_SNAKES } from "@oracle/core";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailPager } from "@/components/detail/DetailPager";
import { DetailToc } from "@/components/detail/DetailToc";
import { ImageZoom } from "@/components/detail/ImageZoom";
import { Board } from "@/components/lila/Board";
import { CellArt } from "@/components/lila/CellArt";
import { lilaCellDescription, lilaCellFromParam, lilaCellImage, lilaCellJsonLd, lilaCellPath, lilaImageFile, lilaParam, LILA_GAME_PATH, LILA_PATH } from "@/lib/lila-paths";
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
    image: { url: lilaCellImage(cell, "page"), alt: `Клетка ${cell.number} «${cell.name}» в игре Лила` },
  });
}

const neighbour = (number: number) => lilaCellByNumber(((number - 1 + LILA_CELLS.length) % LILA_CELLS.length) + 1);
const VISIT_LABELS = ["Первый визит", "Второй визит", "Третий и дальше"] as const;
const GOAL_CELL = 68;

export default async function LilaCellPage({ params }: Params) {
  const cell = lilaCellFromParam((await params).cell);
  if (!cell) notFound();
  const snakeTo = LILA_SNAKES[cell.number];
  const arrowTo = LILA_ARROWS[cell.number];
  const target = snakeTo ?? arrowTo;
  const targetCell = target !== undefined ? lilaCellByNumber(target) : undefined;
  const kind = snakeTo !== undefined ? "Змея" : "Стрела";
  const previous = neighbour(cell.number - 1);
  const next = neighbour(cell.number + 1);
  const available = availableCellImages();
  const jsonLd = JSON.stringify(lilaCellJsonLd(cell, SITE_URL)).replace(/</g, "\\u003c");
  const hasTransition = targetCell !== undefined && Boolean(cell.transition);
  const toc = [
    { id: "o-chem-eto", title: "О чём это" },
    { id: "voprosy", title: "Вопросы для размышления" },
    ...(hasTransition ? [{ id: "perehod", title: kind }] : []),
    { id: "kletka-na-pole", title: "Клетка на поле" },
  ];

  return (
    <main className="detail-page lila-cell-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Навигация" className="detail-crumbs">
        <Link className="touch-link" href={LILA_PATH}>
          Лила
        </Link>{" "}
        › Клетка {cell.number}
      </nav>

      <div className="detail-grid">
        <aside className="detail-side">
          <figure className="detail-media">
            {available.includes(lilaImageFile(cell, "page")) ? (
              <ImageZoom src={lilaCellImage(cell, "card")} fullSrc={lilaCellImage(cell, "page")} alt={`Клетка ${cell.number} «${cell.name}»`} width={440} height={440} priority />
            ) : (
              <CellArt cell={cell} size="page" available={available} priority />
            )}
            <figcaption>
              Клетка {cell.number} · {cell.name}
            </figcaption>
          </figure>
          <DetailToc items={toc} />
        </aside>

        <div className="detail-main">
          <header className="detail-head">
            <h1 className={`display detail-title${cell.name.length > 14 ? " detail-title--long" : ""}`}>{cell.name}</h1>
            {target !== undefined && (
              <p className="detail-note">
                <span aria-hidden="true">{snakeTo !== undefined ? "↘" : "↗"}</span> {kind}: {cell.number} → {target}
              </p>
            )}
            <div className="detail-actions">
              <Link className="button button--lavender" href={LILA_GAME_PATH}>
                Играть в Лилу
              </Link>
              <a className="matrix-link" href="#kletka-na-pole">
                На поле
              </a>
            </div>
          </header>

          <div className="detail-sections">
            <section id="o-chem-eto" className="detail-section" aria-labelledby="o-chem-eto-title">
              <h2 id="o-chem-eto-title">О чём это</h2>
              <p>{cell.about}</p>
            </section>

            <section id="voprosy" className="detail-section" aria-labelledby="questions">
              <h2 id="questions">Вопросы для размышления</h2>
              <ol className="detail-questions">
                {cell.questions.map((question, index) => (
                  <li key={question}>
                    <span className="detail-questions__visit">{VISIT_LABELS[index]}</span>
                    <span className="detail-questions__text">{question}</span>
                  </li>
                ))}
              </ol>
            </section>

            {hasTransition && targetCell && (
              <section id="perehod" className="detail-section" aria-labelledby="transition">
                <h2 id="transition">
                  {kind}: {cell.number} → {target}
                </h2>
                <p>{cell.transition}</p>
                <Link className="detail-target" href={lilaCellPath(targetCell)}>
                  <Image src={lilaCellImage(targetCell, "thumb")} alt="" width={80} height={80} unoptimized />
                  <span>
                    <span className="detail-target__label">Клетка {targetCell.number}</span>
                    <span className="detail-target__name">{targetCell.name}</span>
                  </span>
                </Link>
              </section>
            )}

            <section id="kletka-na-pole" className="detail-section" aria-labelledby="board-title">
              <h2 id="board-title">Клетка на поле</h2>
              <div className="detail-board">
                <Board current={cell.number} variant="locator" />
              </div>
              <p className="detail-board__caption">
                <span>
                  {cell.number} · {cell.name}
                </span>
                <span>Цель игры · {GOAL_CELL}</span>
              </p>
            </section>
          </div>
        </div>
      </div>

      <DetailPager
        label="Соседние клетки"
        previous={{ href: lilaCellPath(previous), label: `${previous.number} · ${previous.name}`, image: lilaCellImage(previous, "thumb"), imageSize: 64 }}
        next={{ href: lilaCellPath(next), label: `${next.number} · ${next.name}`, image: lilaCellImage(next, "thumb"), imageSize: 64 }}
      />
    </main>
  );
}
