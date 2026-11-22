import { lilaCellByNumber } from "@oracle/content/lila";
import { LILA_ARROWS, LILA_SNAKES } from "@oracle/core";
import Link from "next/link";
import { LILA_GAME_PATH, LILA_PATH, lilaCellPath } from "@/lib/lila-paths";

// Таблица собирается из тех же таблиц переходов, что и движок игры, поэтому не расходится с правилами
function TransitionTable({ caption, transitions }: { caption: string; transitions: Readonly<Record<number, number>> }) {
  const rows = Object.entries(transitions)
    .map(([from, to]) => ({ from: lilaCellByNumber(Number(from)), to: lilaCellByNumber(to) }))
    .sort((a, b) => a.from.number - b.from.number);
  return (
    <div className="blog-table-wrap">
      <table className="blog-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Клетка</th>
            <th scope="col">Ведёт на</th>
            <th scope="col">Название</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ from, to }) => (
            <tr key={from.number}>
              <td>{from.number}</td>
              <td>{to.number}</td>
              <td>
                <Link href={lilaCellPath(from)}>{from.name}</Link> → <Link href={lilaCellPath(to)}>{to.name}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LilaSnakesArrows() {
  return (
    <>
      <p>
        На поле Лилы двадцать переходов: десять змей и десять стрел. Змея возвращает фишку назад, стрела переносит вперёд. У каждого перехода
        свой смысл: он связывает две клетки и показывает, как одна тема переходит в другую.
      </p>

      <h2>Как читать переходы</h2>
      <p>
        Змея — это возвращение. Она приводит к теме, которую полезно разобрать честнее: зависть возвращает к сравнению, ревность — к нехватке и
        желанию удержать. Стрела — это подъём: очищение, сострадание, благотворительность переносят фишку далеко вперёд, к более светлому
        состоянию. Это символы, а не оценки: змея не значит «вы сделали плохо».
      </p>
      <p>
        Важно различать два слоя. Сам переход определяют бросок и устройство поля: змея или стрела не зависят от ваших мыслей и решений.
        Смысл появляется потом, когда вы отвечаете на вопрос клетки и сопоставляете образ со своей ситуацией.
      </p>

      <h2>Десять змей</h2>
      <TransitionTable caption="Змеи Лилы" transitions={LILA_SNAKES} />

      <h2>Десять стрел</h2>
      <TransitionTable caption="Стрелы Лилы" transitions={LILA_ARROWS} />
      <p>Каждое название в таблицах — ссылка на страницу клетки с описанием, вопросами и картой поля.</p>

      <h2>Что делать, когда встретилась змея</h2>
      <ol>
        <li>Прочитайте вопрос клетки, на которую вернулись, — он часто продолжает тему предыдущей.</li>
        <li>Запишите одну мысль: чего в этой теме не хватало.</li>
        <li>Если змея на одной и той же клетке встречается снова, откроется следующий из трёх вопросов клетки. Повтор можно использовать как повод присмотреться к теме, но частота попаданий сама по себе ничего не доказывает.</li>
      </ol>

      <h2>Что делать, когда встретилась стрела</h2>
      <ol>
        <li>Остановитесь и спросите себя, с чем вы связываете этот подъём. Стрела не награда за мысль или решение, её определил бросок; вопрос помогает осмыслить образ.</li>
        <li>Не пытайтесь удержать состояние. Стрела — это переход, а не итог.</li>
        <li>Задайте вопрос новой клетки, как будто вы пришли на неё впервые.</li>
      </ol>
      <p className="row">
        <Link className="button button--ghost" href={LILA_PATH}>
          Посмотреть все 72 клетки
        </Link>
        <Link className="button button--lavender" href={LILA_GAME_PATH}>
          Играть
        </Link>
      </p>
    </>
  );
}
