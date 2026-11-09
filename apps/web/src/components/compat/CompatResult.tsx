import { arcanumByNumber } from "@oracle/content";
import { compatSpheresByNumber, compatUnionByNumber, type CompatSpheres } from "@oracle/content/compat";
import { KEY_POINTS, type Compatibility } from "@oracle/core";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { arcanumImage, arcanumPath } from "@/lib/arcana-paths";
import { compatArcanumPath, compatSummary, POINT_LABELS } from "@/lib/compat";

type Props = { compat: Compatibility; headingRef?: Ref<HTMLHeadingElement>; actions: ReactNode };

const nameOf = (number: number) => arcanumByNumber(number).name;

function Person({ title, person }: { title: string; person: Compatibility["people"][number] }) {
  return (
    <section className="card stack compat-person" aria-label={title}>
      <h3>{title}</h3>
      {KEY_POINTS.map((point) => {
        const arcanum = arcanumByNumber(person[point]);
        return (
          <div key={point} className="stack compat-person__point">
            <p className="compat-metric">
              <span className="eyebrow">{POINT_LABELS[point]}</span>
              <Link href={arcanumPath(arcanum)}>
                {arcanum.number} · {arcanum.name}
              </Link>
            </p>
            {arcanum.love.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        );
      })}
    </section>
  );
}

// Сферы союза: выводятся, только когда владелица приняла тексты (COMPAT_SPHERES_ACCEPTED)
function Spheres({ spheres }: { spheres: CompatSpheres }) {
  return (
    <section className="stack compat-spheres" aria-labelledby="compat-spheres-title">
      <h2 id="compat-spheres-title">Аркан {spheres.number} в жизни пары</h2>
      <div className="compat-spheres__grid">
        <div className="card stack">
          <h3>Что сближает</h3>
          <p>{spheres.closer}</p>
        </div>
        <div className="card stack">
          <h3>Где возможны разногласия</h3>
          <p>{spheres.friction}</p>
        </div>
        <div className="card stack">
          <h3>Как договариваться</h3>
          <p>{spheres.agree}</p>
        </div>
        <div className="card stack">
          <h3>Вопрос для разговора</h3>
          <p className="lila-turn__question">{spheres.question}</p>
        </div>
      </div>
    </section>
  );
}

export function CompatResult({ compat, headingRef, actions }: Props) {
  const arcanum = arcanumByNumber(compat.pair);
  const union = compatUnionByNumber(compat.pair);
  const spheres = compatSpheresByNumber(compat.pair);
  return (
    <section className="stack compat-result" aria-labelledby="compat-pair-title">
      <h2 id="compat-pair-title" ref={headingRef} tabIndex={-1}>
        Аркан вашей пары
      </h2>
      <div className="card stack compat-pair">
        <Image className="compat-pair__art" src={arcanumImage(arcanum, "card")} alt="" width={480} height={480} unoptimized />
        <div className="stack compat-pair__body">
          <p className="eyebrow">Аркан {arcanum.number}</p>
          <p className="display compat-pair__name">{arcanum.name}</p>
          <p>{union.essence}</p>
          <p className="compat-fact">
            <strong>Что даёт: </strong>
            {union.gives}
          </p>
          <p className="compat-fact">
            <strong>Где стоит присмотреться: </strong>
            {union.attention}
          </p>
          <p className="lila-turn__question">
            <strong>Вопрос для двоих:</strong> {union.question}
          </p>
          {/* В новой вкладке: результат живёт только в этой вкладке, даты нигде не сохраняются */}
          <p>
            <Link className="matrix-link" href={compatArcanumPath(arcanum)} target="_blank" rel="noopener">
              Подробнее об аркане {arcanum.number} в паре<span className="visually-hidden"> (откроется в новой вкладке)</span>
            </Link>
          </p>
        </div>
      </div>

      {spheres && <Spheres spheres={spheres} />}

      <h2>Вы и партнёр</h2>
      <div className="compat-people">
        <Person title="Вы" person={compat.people[0]} />
        <Person title="Партнёр" person={compat.people[1]} />
      </div>

      <section className="card stack" aria-labelledby="compat-summary-title">
        <h2 id="compat-summary-title">Где вы похожи и где различаетесь</h2>
        {compatSummary(compat, nameOf).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>
      <div className="row compat-actions">{actions}</div>
    </section>
  );
}
