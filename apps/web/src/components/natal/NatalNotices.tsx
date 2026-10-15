import type { NatalChart } from "@oracle/core/natal";
import {
  CHOICE_FIRST,
  CHOICE_GROUP_LABEL,
  CHOICE_SECOND,
  NOTICE_AMBIGUOUS,
  NOTICE_EARLY,
  NOTICE_NO_TIME,
  NOTICE_POLAR,
  gapNotice,
  signChangeNotice,
} from "@/lib/natal-copy";
import type { ClockKind, ZoneChoice } from "@/lib/natal-moment";

// Плашки над результатом: время переведено вперёд (gap) или назад (ambiguous), нет времени рождения, смена знака, полярный круг, ранние годы
const POLAR_LATITUDE = 66;
const EARLY_BEFORE = "1930-01-01";

export type NatalNoticesProps = {
  clock: ClockKind;
  correctedTime: string | null;
  choice: ZoneChoice | null;
  onChoose?: (choice: ZoneChoice) => void;
  chart: NatalChart | null; // null — время было дважды, и карта ещё не построена
  date: string; // ГГГГ-ММ-ДД
  latitude: number;
};

type Notice = { kind: string; text: string };

export function noticesFor({ clock, correctedTime, chart, date, latitude }: Pick<NatalNoticesProps, "clock" | "correctedTime" | "chart" | "date" | "latitude">): Notice[] {
  const notices: Notice[] = [];
  if (clock === "gap" && correctedTime) notices.push({ kind: "gap", text: gapNotice(correctedTime) });
  if (clock === "ambiguous") notices.push({ kind: "ambiguous", text: NOTICE_AMBIGUOUS });
  if (!chart) return notices; // карта не построена: остальное относится к результату
  if (!chart.timeKnown) notices.push({ kind: "no-time", text: NOTICE_NO_TIME });
  for (const body of chart.uncertainSigns) notices.push({ kind: "sign-change", text: signChangeNotice(body) });
  if (Math.abs(latitude) > POLAR_LATITUDE) notices.push({ kind: "polar", text: NOTICE_POLAR });
  if (date < EARLY_BEFORE) notices.push({ kind: "early", text: NOTICE_EARLY });
  return notices;
}

export function NatalNotices(props: NatalNoticesProps) {
  const notices = noticesFor(props);
  if (notices.length === 0) return null;
  const choices: readonly { value: ZoneChoice; label: string }[] = [
    { value: "first", label: CHOICE_FIRST },
    { value: "second", label: CHOICE_SECOND },
  ];

  return (
    <>
      <div className="natal-notices">
        {notices.map((notice, index) => (
          <div key={`${notice.kind}-${index}`} className={`natal-notice natal-notice--${notice.kind}`} role="status">
            <span className="natal-notice__icon" aria-hidden="true">
              i
            </span>
            <p>{notice.text}</p>
          </div>
        ))}
      </div>
      {props.clock === "ambiguous" && (
        <div className="natal-choice-group" role="group" aria-label={CHOICE_GROUP_LABEL}>
          {choices.map((choice) => (
            <button key={choice.value} type="button" className="natal-choice" aria-pressed={props.choice === choice.value} onClick={() => props.onChoose?.(choice.value)}>
              {choice.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
