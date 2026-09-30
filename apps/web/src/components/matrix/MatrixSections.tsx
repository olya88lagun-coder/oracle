import { ARCANA, arcanumByNumber } from "@oracle/content";
import Image from "next/image";
import Link from "next/link";
import { arcanumImage, arcanumPath } from "@/lib/arcana-paths";
import { MATRIX_FORM_ID } from "./matrix-ids";

// Иллюстративные примеры трёх точек: это образы из мира арканов, а не результат расчёта
const PREVIEW: readonly { number: number; title: string; tag: string; text: string }[] = [
  { number: 1, title: "Личность", tag: "Как вас видят", text: "Аркан вашего дня. Как вы проявляетесь и какое впечатление оставляете." },
  { number: 9, title: "Центр", tag: "В чём ваша опора", text: "Общий тон матрицы. То, к чему можно возвращаться за ресурсом и ясностью." },
  { number: 17, title: "Задача", tag: "Куда направить внимание", text: "Тема, к которой стоит присмотреться. Повод заметить повторения и возможности роста." },
];

// Три точки: открытая композиция из трёх образов с короткими подписями
export function MatrixPreview() {
  return (
    <section className="matrix-wrap matrix-block" aria-labelledby="matrix-preview">
      <div className="matrix-heading">
        <h2 id="matrix-preview">
          Три точки. <em>Ближе к себе.</em>
        </h2>
        <p>Матрица складывается в диаграмму. Начните с трёх главных тем.</p>
      </div>
      <ol className="matrix-preview">
        {PREVIEW.map((item) => {
          const arcanum = arcanumByNumber(item.number);
          return (
            <li key={item.title}>
              <div className="matrix-preview__art">
                <Image src={arcanumImage(arcanum, "card")} alt={`Аркан ${arcanum.name}`} fill unoptimized sizes="(min-width: 900px) 360px, 120px" />
              </div>
              <div className="matrix-preview__heading">
                <h3>{item.title}</h3>
                <span>{item.tag}</span>
              </div>
              <p>{item.text}</p>
            </li>
          );
        })}
      </ol>
      <p className="matrix-note">Изображения показывают мир арканов. Ваша дата определит собственные три образа.</p>
    </section>
  );
}

// Все 22 аркана: ряд миниатюр с номером и названием
export function MatrixLibrary() {
  return (
    <section className="matrix-wrap matrix-block" aria-labelledby="matrix-library">
      <div className="matrix-heading">
        <h2 id="matrix-library">Мир 22 арканов</h2>
        <p>У каждого образа есть светлая и сложная стороны. Посмотрите, какой откликается вам сейчас.</p>
      </div>
      <ul className="matrix-library">
        {ARCANA.map((arcanum) => (
          <li key={arcanum.number}>
            <Link href={arcanumPath(arcanum)}>
              <span className="matrix-library__art">
                <Image src={arcanumImage(arcanum, "thumb")} alt="" fill unoptimized sizes="(min-width: 900px) 140px, 33vw" />
              </span>
              <span className="matrix-library__caption">
                <b>{String(arcanum.number).padStart(2, "0")}</b>
                <span>{arcanum.name}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Финальный призыв: ссылка к форме, а не вторая кнопка расчёта
export function MatrixCta() {
  return (
    <section className="matrix-wrap matrix-cta" aria-labelledby="matrix-cta">
      <div>
        <h2 id="matrix-cta">Начните со своей даты.</h2>
        <p>Без предсказаний — как зеркало для размышления.</p>
      </div>
      <a className="button button--lavender" href={`#${MATRIX_FORM_ID}`}>
        К расчёту
      </a>
    </section>
  );
}
