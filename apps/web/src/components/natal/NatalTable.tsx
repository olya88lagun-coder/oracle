import type { ChartAngle, ChartPoint, NatalChart } from "@oracle/core/natal";
import Link from "next/link";
import {
  ANGLE_AXIS_LABELS,
  ANGLE_NAMES,
  BODY_NAMES,
  MEANING_LINK_HINT,
  POSITIONS_TITLE,
  RETROGRADE_LABEL,
  SIGN_NAMES,
  TABLE_HEAD_BODY,
  TABLE_HEAD_DEGREES,
  TABLE_HEAD_HOUSE,
  TABLE_HEAD_SIGN,
  TABLE_LABEL,
  TABLE_NO_HOUSE,
  formatDegrees,
  housesCaption,
} from "@/lib/natal-copy";
import { NATAL_KEY_TEXTS, keyTextFor, type NatalKeyBody, type NatalKeyRegistry } from "@/lib/natal-texts";
import { NatalGlyph, bodyGlyphId } from "./NatalGlyph";

// Таблица положений: десять тел, лунный узел и, если известно время, асцендент с МС. Без времени столбца «Дом», строк осей и подписи о домах нет.
// Название тела и асцендента — ссылка на страницу значения, если она открыта; у лунного узла и МС страниц значений нет

type Row = { key: string; name: RowName; sign: ChartPoint["sign"]; degree: number; retrograde: boolean; house: string; meaningBody: NatalKeyBody | null };
type RowName = { glyph: string | null; axis: string | null; text: string };

function pointRow(point: ChartPoint): Row {
  return {
    key: point.id,
    name: { glyph: bodyGlyphId(point.id), axis: null, text: BODY_NAMES[point.id] },
    sign: point.sign,
    degree: point.degree,
    retrograde: point.retrograde,
    house: point.house === null ? TABLE_NO_HOUSE : String(point.house),
    meaningBody: point.id === "northNode" ? null : point.id,
  };
}

function angleRow(key: "ascendant" | "midheaven", angle: ChartAngle): Row {
  // У осей номера дома нет: они лежат на границах домов
  return { key, name: { glyph: null, axis: ANGLE_AXIS_LABELS[key], text: ANGLE_NAMES[key] }, sign: angle.sign, degree: angle.degree, retrograde: false, house: TABLE_NO_HOUSE, meaningBody: key === "ascendant" ? "ascendant" : null };
}

// prefetch выключен: иначе браузер заранее запрашивал бы страницы по знакам карты, а они выводятся из даты, времени и места рождения
function NameText({ row, registry }: { row: Row; registry: NatalKeyRegistry }) {
  const published = row.meaningBody ? keyTextFor(row.meaningBody, row.sign, registry) : null;
  if (!published) return <span>{row.name.text}</span>;
  return (
    <Link className="natal-table__meaning-link" href={published.href} prefetch={false}>
      <span>{row.name.text}</span>
      <span className="sr-only">{` — ${MEANING_LINK_HINT}`}</span>
    </Link>
  );
}

export function NatalTable({ chart, registry = NATAL_KEY_TEXTS }: { chart: NatalChart; registry?: NatalKeyRegistry }) {
  const showHouses = chart.timeKnown && chart.houses !== null;
  const rows: Row[] = chart.points.map(pointRow);
  if (chart.timeKnown && chart.ascendant) rows.push(angleRow("ascendant", chart.ascendant));
  if (chart.timeKnown && chart.midheaven) rows.push(angleRow("midheaven", chart.midheaven));

  return (
    <div className="natal-positions">
      <h3>{POSITIONS_TITLE}</h3>
      <table className="natal-table" aria-label={TABLE_LABEL}>
        <thead>
          <tr>
            <th scope="col">{TABLE_HEAD_BODY}</th>
            <th scope="col">{TABLE_HEAD_SIGN}</th>
            <th scope="col">{TABLE_HEAD_DEGREES}</th>
            {showHouses && <th scope="col">{TABLE_HEAD_HOUSE}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>
                <span className="natal-table__body-name">
                  {row.name.glyph && <NatalGlyph id={row.name.glyph} variant="table" />}
                  {row.name.axis && (
                    <span className="natal-summary__axis" aria-hidden="true">
                      {row.name.axis}
                    </span>
                  )}
                  <NameText row={row} registry={registry} />
                </span>
              </td>
              <td>
                <span className="natal-table__sign-name">
                  <NatalGlyph id={row.sign} variant="table" />
                  <span>{SIGN_NAMES[row.sign]}</span>
                </span>
              </td>
              <td>
                <span className="natal-table__degree">
                  {formatDegrees(row.degree)}
                  {row.retrograde && (
                    <>
                      <NatalGlyph id="retro" variant="retro" />
                      <span className="sr-only">{RETROGRADE_LABEL}</span>
                    </>
                  )}
                </span>
              </td>
              {showHouses && <td>{row.house}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {chart.houses && <p className="natal-table__caption">{housesCaption(chart.houses.system)}</p>}
    </div>
  );
}
