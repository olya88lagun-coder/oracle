import type { NatalChart } from "@oracle/core/natal";
import type { ReactNode, Ref } from "react";
import type { NatalInput } from "@/lib/natal-input";
import type { ClockKind, ZoneChoice } from "@/lib/natal-moment";
import { NatalNotices } from "./NatalNotices";
import { NatalResult } from "./NatalResult";

export type Outcome = {
  input: NatalInput; // проверенные данные, по которым считали
  chart: NatalChart | null; // null — время было дважды, и человек ещё не выбрал
  clock: ClockKind;
  correctedTime: string | null;
  choice: ZoneChoice | null;
};

type Props = {
  outcome: Outcome;
  titleId: string; // id заголовка результата: им подписана обёртка
  outcomeRef?: Ref<HTMLDivElement>;
  choiceRef?: Ref<HTMLDivElement>;
  onChoose?: (choice: ZoneChoice) => void;
  onRecalculate?: () => void;
  offer?: ReactNode; // блок продажи платного разбора для результата
  saveAction?: ReactNode; // блок «Сохранить в портрет» для результата
};

// Плашки и результат под формой — в порядке макета (плашки выше результата). Когда карта построена, обёртка — цель фокуса и прокрутки:
// так плашки (перевод часов, полярный круг, ранние годы, смена знака, нет времени) остаются в поле зрения и читаются перед заголовком
// результата, а группа подписана этим заголовком («Ваша натальная карта»). Пока карта ждёт выбора, обёртка просто контейнер.
export function NatalOutcome({ outcome, titleId, outcomeRef, choiceRef, onChoose, onRecalculate, saveAction, offer }: Props) {
  const { chart, input } = outcome;
  // Время в подписи карты — то, по которому её посчитали (при переводе часов вперёд это исправленное время)
  const birth = { city: input.city.name, date: input.date, time: input.time === null ? null : (outcome.correctedTime ?? input.time) };
  const labelled = chart ? ({ role: "group", "aria-labelledby": titleId, tabIndex: -1 } as const) : {};

  return (
    <div className="natal-outcome" ref={outcomeRef} {...labelled}>
      <NatalNotices
        clock={outcome.clock}
        correctedTime={outcome.correctedTime}
        choice={outcome.choice}
        onChoose={onChoose}
        choiceRef={choiceRef}
        chart={chart}
        date={input.date}
        latitude={input.city.latitude}
      />
      {chart && <NatalResult chart={chart} birth={birth} titleId={titleId} onRecalculate={onRecalculate} saveAction={saveAction} offer={offer} />}
    </div>
  );
}
