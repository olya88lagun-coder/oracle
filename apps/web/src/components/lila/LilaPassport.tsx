import { LILA_ARROWS, LILA_ENTRY_ROLL, LILA_GOAL_CELL, LILA_MAX_MOVES, LILA_MIN_MOVES_TO_FINISH } from "@oracle/core";
import Link from "next/link";
import { blogPath, blogPostBySlug } from "@/lib/blog";

const rules = blogPostBySlug("kak-igrat-v-lilu-onlain");
const arrowToGoal = Object.entries(LILA_ARROWS).find(([, to]) => to === LILA_GOAL_CELL)?.[0];

// Паспорт партии на экране выбора намерения: правила нашей версии, которые нужно знать до первого броска. Числа берутся из движка игры, поэтому не расходятся с ним
export function LilaPassport({ guest }: { guest: boolean }) {
  return (
    <section className="lila-passport" aria-labelledby="lila-passport-title">
      <h3 id="lila-passport-title">Правила этой партии</h3>
      <dl>
        <div>
          <dt>Вход на поле</dt>
          <dd>Выпала {LILA_ENTRY_ROLL}: фишка встаёт на клетку 1. Пока шестёрки нет, ходы считаются паузой.</dd>
        </div>
        <div>
          <dt>Цель</dt>
          <dd>Клетка {LILA_GOAL_CELL}: точным броском{arrowToGoal ? ` или стрелой с клетки ${arrowToGoal}` : ""}. Если выпало больше, чем нужно, фишка остаётся на месте.</dd>
        </div>
        <div>
          <dt>Завершить партию</dt>
          <dd>На цели или начиная с {LILA_MIN_MOVES_TO_FINISH}-го хода, если вам достаточно пройденного пути.</dd>
        </div>
        <div>
          <dt>Предел</dt>
          <dd>Не больше {LILA_MAX_MOVES} ходов в одной партии.</dd>
        </div>
        <div>
          <dt>Продолжить позже</dt>
          <dd>{guest ? "Гостевую партию можно продолжить в этом же браузере; чтобы вернуться с другого устройства, сохраните её после входа." : "Партию можно прервать: она хранится в «Моём портрете», и её можно продолжить."}</dd>
        </div>
      </dl>
      <p className="hint">
        Это правила нашего сайта: в других версиях Лилы вход и ход после шестёрки могут быть устроены иначе.
        {rules && <> <Link href={blogPath(rules)}>Подробно о правилах</Link>.</>}
      </p>
    </section>
  );
}
