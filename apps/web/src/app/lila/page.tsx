import { LILA_CELLS } from "@oracle/content/lila";
import type { Metadata } from "next";
import Link from "next/link";
import { Board } from "@/components/lila/Board";
import { Scene } from "@/components/Scene";
import { DISCLAIMER } from "@/lib/legal";
import { lilaCellPath, LILA_GAME_PATH, LILA_PATH } from "@/lib/lila-paths";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Лила онлайн — игра с намерением, поле из 72 клеток",
  description: "Сформулируйте намерение, бросайте кубик и проходите путь по 72 клеткам Лилы: у каждой клетки — тема, вопрос и ваша запись. Бесплатно и без регистрации.",
  path: LILA_PATH,
  absoluteTitle: true,
});

export default function LilaPage() {
  return (
    <Scene>
      <div className="scene__intro stack">
        <p className="eyebrow eyebrow--line">Практика</p>
        <h1 className="display">Лила — игра с вашим намерением</h1>
        <p className="lead">
          Сформулируйте намерение, бросайте кубик и проходите путь по 72 клеткам: у каждой — тема, вопрос и, при желании, ваша запись. Это способ посмотреть на свой вопрос по-новому, а не предсказание.
        </p>
        <p>
          <Link className="button button--lavender" href={LILA_GAME_PATH}>
            Играть
          </Link>
        </p>
        <p className="muted">Без регистрации · партия сохраняется в вашем браузере</p>
      </div>

      <section className="card stack" aria-labelledby="how">
        <h2 id="how">Как играть</h2>
        <ol>
          <li>Выберите намерение — один личный вопрос, к которому вы готовы возвращаться.</li>
          <li>Бросайте кубик. Чтобы начать, нужна шестёрка.</li>
          <li>На каждой клетке — короткий текст и вопрос для размышления. Записать мысль можно, но не обязательно.</li>
          <li>Стрелы поднимают на другую клетку, змеи возвращают к теме, которая просит внимания. Цель пути — клетка 68, попасть на неё можно только точным броском.</li>
        </ol>
      </section>

      <section className="stack" aria-labelledby="field">
        <h2 id="field">Поле Лилы</h2>
        <Board current={1} variant="full" />
        <Board current={1} variant="compact" />
      </section>

      <section className="stack" aria-labelledby="cells">
        <h2 id="cells">72 клетки</h2>
        <ul className="lila-cell-grid">
          {LILA_CELLS.map((cell) => (
            <li key={cell.number}>
              <Link className="touch-link" href={lilaCellPath(cell)}>
                {cell.number} · {cell.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="muted">{DISCLAIMER}</p>
    </Scene>
  );
}
