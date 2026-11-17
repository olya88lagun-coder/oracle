import { arcanumByNumber, type Arcanum } from "@oracle/content";
import Link from "next/link";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { arcanumExample } from "@/lib/arcana-example";

// Учебный пример на странице аркана: как из вымышленной даты получаются ключевые точки и где в них стоит этот аркан. Заголовков h3 нет: их занимают вопросы FAQ.
export function ArcanumExample({ arcanum }: { arcanum: Arcanum }) {
  const example = arcanumExample(arcanum.number);
  const byPoint = Object.fromEntries(example.steps.map((step) => [step.point, step.arcanum]));
  const name = (number: number) => arcanumByNumber(number).name;
  return (
    <>
      <p>
        Возьмём вымышленную дату <strong>{example.dateLabel}</strong>. День рождения {example.day} — это уже аркан {arcanum.number} «{arcanum.name}»: он становится личностью матрицы. Остальные ключевые точки считаются по шагам; если число получается больше 22, складываем его цифры.
      </p>
      <ol className="arcanum-example__steps">
        {example.steps.map((step) => (
          <li key={step.point}>
            <span className="arcanum-example__label">{step.label}</span>
            <span className="arcanum-example__formula">
              {step.formula} → аркан {step.arcanum} «{name(step.arcanum)}»
            </span>
          </li>
        ))}
      </ol>
      <p>
        Итог для этой даты: личность — {byPoint.A} «{name(byPoint.A!)}», центр — {byPoint.E} «{name(byPoint.E!)}», задача — {byPoint.D} «{name(byPoint.D!)}». Аркан {arcanum.number} здесь стоит в личности, поэтому читайте его по разделу «В личности». В другой дате тот же аркан может оказаться в центре или в задаче, и тогда смысл читается по соответствующему разделу.
      </p>
      <p>
        <Link className="touch-link" href={MATRIX_PATH}>
          Посчитать по своей дате
        </Link>
      </p>
    </>
  );
}
