import { calculateMatrix, type MatrixPoint } from "@oracle/core";
import { computeNatalChart } from "@oracle/core/natal";
import { TAROT_DECK, type TarotCard } from "@oracle/content/tarot";
import Link from "next/link";
import Image from "next/image";
import { DIAGRAM_LINES, DIAGRAM_POINTS, pointTitle } from "@/lib/matrix-view";
import { TARO_AUTHOR_CREDIT, taroCardImage, taroCardPath } from "@/lib/taro-paths";
import { NatalSprite } from "@/components/natal/NatalSprite";
import { NatalWheel } from "@/components/natal/NatalWheel";
import { NatalWheelZoom } from "@/components/natal/NatalWheelZoom";

type MatrixExample = {
  date: { day: number; month: number; year: number };
  title: string;
  points: readonly MatrixPoint[];
  full?: boolean;
};
const ALL_OUTER: readonly MatrixPoint[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const MATRIX_EXAMPLES: Readonly<Record<string, MatrixExample>> = {
  "skhema-matritsy-sudby": { date: { day: 27, month: 11, year: 1984 }, title: "Схема с обозначениями всех точек", points: ALL_OUTER, full: true },
  "kak-rasschitat-matritsu-sudby": { date: { day: 27, month: 11, year: 1984 }, title: "Куда попадают числа из примера расчёта", points: ["A", "B", "C", "D", "E"], full: true },
  "rodovoj-kvadrat-v-matritse-sudby": { date: { day: 29, month: 11, year: 2001 }, title: "Родовой квадрат: F, G, H и I", points: ["F", "G", "H", "I", "E"] },
  "lichnost-i-tsentr-v-matritse-sudby": { date: { day: 15, month: 3, year: 1990 }, title: "Личность A и центр E на одной схеме", points: ["A", "E"] },
  "zadacha-v-matritse-sudby": { date: { day: 29, month: 11, year: 2001 }, title: "Точка D — задача в примере статьи", points: ["A", "B", "C", "D"] },
  "liniya-deneg-v-matritse-sudby": { date: { day: 29, month: 3, year: 1988 }, title: "Внутренние точки и денежная линия", points: ["E", "C2", "D2", "heart", "money", "love"] },
  "liniya-lyubvi-v-matritse-sudby": { date: { day: 14, month: 3, year: 1992 }, title: "Где находится линия отношений", points: ["D2", "heart", "love"] },
};
const shortName = (point: MatrixPoint) => ({ heart: "♥", money: "₽", love: "Л" }[point as "heart" | "money" | "love"] ?? point);
function letterPosition(point: (typeof DIAGRAM_POINTS)[number]) {
  const offsets: Partial<Record<MatrixPoint, readonly [number, number]>> = {
    B1: [26, 0], B2: [-26, 0], D1: [-26, 0], D2: [-26, 0],
    F1: [20, -18], F2: [-25, 0], G1: [-20, -18], G2: [25, 0],
    H1: [26, 0], H2: [-26, 0], I1: [-26, 0], I2: [-26, 0],
    H: [30, 0], I: [-30, 0], D: [0, 34],
    heart: [24, 0], money: [24, 0], love: [0, 26],
  };
  const offset = offsets[point.point];
  return offset ? { x: point.x + offset[0], y: point.y + offset[1] } : { x: point.x, y: point.y - point.r - 10 };
}

function MatrixStudyFigure({ slug, example }: { slug: string; example: MatrixExample }) {
  const matrix = calculateMatrix(example.date);
  const highlighted = new Set(example.points);
  const visible = example.full ? DIAGRAM_POINTS : DIAGRAM_POINTS.filter(p => ALL_OUTER.includes(p.point) || highlighted.has(p.point));
  const titleId = `study-${slug}`;
  const date = [example.date.day, example.date.month, example.date.year].map((v, i) => i < 2 ? String(v).padStart(2, "0") : v).join(".");
  return (
    <figure className="study-figure" aria-labelledby={titleId}>
      <figcaption id={titleId}>{example.title}</figcaption>
      <div className={`study-matrix${example.full ? " study-matrix--full" : ""}`}>
        <div className="study-matrix__viewport" tabIndex={0} role="region" aria-label="Схема точек с прокруткой">
          <svg viewBox="-24 -24 448 448" role="img" aria-labelledby={`${titleId}-drawing`}>
            <title id={`${titleId}-drawing`}>{`Матрица на вымышленной дате ${date}: буквы обозначают точки, числа — арканы`}</title>
            {DIAGRAM_LINES.map(([from, to]) => {
              if (!visible.some(p => p.point === from) || !visible.some(p => p.point === to)) return null;
              const a = DIAGRAM_POINTS.find(p => p.point === from)!;
              const b = DIAGRAM_POINTS.find(p => p.point === to)!;
              return <line key={`${from}-${to}`} className={`study-matrix__line${highlighted.has(from) && highlighted.has(to) ? " is-highlighted" : ""}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
            })}
            {visible.map(p => (
              <g key={p.point} className={`study-matrix__point${highlighted.has(p.point) ? " is-highlighted" : ""}`} data-point={p.point} data-value={matrix[p.point]}>
                <title>{pointTitle(p.point, matrix[p.point])}</title>
                <circle cx={p.x} cy={p.y} r={p.r} />
                <text x={p.x} y={p.y} className={p.r < 18 ? "study-matrix__small-value" : undefined}>{matrix[p.point]}</text>
                <text className="study-matrix__letter" {...letterPosition(p)}>{shortName(p.point)}</text>
              </g>
            ))}
          </svg>
        </div>
        <dl className="study-matrix__key">
          {example.points.map(point => <div key={point}><dt>{shortName(point)}</dt><dd>{pointTitle(point, matrix[point])}</dd></div>)}
        </dl>
      </div>
      <p className="study-figure__note">Вымышленная дата: {date}. Выделены точки, о которых идёт речь в статье. На телефоне схему можно прокручивать. {example.full ? "Индексы 1 и 2 обозначают внутренние точки на пути от внешнего узла к центру." : "Буквы обозначают позиции на схеме; числа внутри кругов — рассчитанные арканы."}</p>
    </figure>
  );
}

const SUITS = ["zhezly", "kubki", "mechi", "pentakli"] as const;
function TarotStudyFigure({ courts }: { courts: boolean }) {
  const slugs = courts ? ["pazh", "ryttsar", "koroleva", "korol"].flatMap(rank => SUITS.map(suit => `${suit}-${rank}`)) : SUITS.map(suit => `${suit}-tuz`);
  const cards = slugs.map(slug => TAROT_DECK.find(card => card.slug === slug)!).filter((card): card is TarotCard => Boolean(card));
  const id = courts ? "study-courts" : "study-suits";
  return (
    <figure className="study-figure" aria-labelledby={id}>
      <figcaption id={id}>{courts ? "Четыре ранга в четырёх мастях" : "Четыре масти рядом: сравните тузы"}</figcaption>
      <ul className="study-tarot">
        {cards.map(card => (
          <li key={card.slug}>
            <figure>
              <Link href={taroCardPath(card)} prefetch={false} aria-label={`Значение: ${card.name}`}>
                <Image src={taroCardImage(card, "card")} alt={card.name} width={277} height={480} unoptimized sizes="(min-width: 700px) 160px, 40vw" />
              </Link>
              <figcaption>{card.name}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="study-figure__note">{TARO_AUTHOR_CREDIT}. Нажмите на карту, чтобы открыть её значение.</p>
    </figure>
  );
}

function NatalHouseStudyFigure() {
  const chart = computeNatalChart({ instant: new Date("1990-03-07T09:25:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown: true });
  return (
    <figure className="study-figure" aria-labelledby="study-natal-houses">
      <figcaption id="study-natal-houses">Как найти дом: Солнце в 10-м доме</figcaption>
      <NatalSprite />
      <div className="study-natal">
        <div><NatalWheel chart={chart} birth={{ city: "Москва", date: "1990-03-07", time: "12:25" }} /><NatalWheelZoom chart={chart} birth={{ city: "Москва", date: "1990-03-07", time: "12:25" }} /></div>
        <ol className="study-natal__key">
          <li><strong>Найдите символ ☉.</strong> В этом примере Солнце находится в Рыбах.</li>
          <li><strong>Проследите сектор к центру.</strong> Номер 10 внутри колеса обозначает дом; ♓ на внешнем кольце — знак.</li>
          <li><strong>Сопоставьте три части.</strong> Солнце — планета, Рыбы — знак, 10 — дом. Эти обозначения отвечают на разные вопросы.</li>
        </ol>
      </div>
      <p className="study-figure__note">Учебный пример на вымышленных данных: Москва, 7 марта 1990, 12:25. Дома — Плацидус. В своей карте сверяйте положение с таблицей планет; без известного времени рождения дома не определяются.</p>
    </figure>
  );
}

export function ArticleStudyFigure({ slug }: { slug: string }) {
  const example = MATRIX_EXAMPLES[slug];
  if (example) return <MatrixStudyFigure slug={slug} example={example} />;
  if (slug === "masti-taro") return <TarotStudyFigure courts={false} />;
  if (slug === "pridvornye-karty-taro") return <TarotStudyFigure courts />;
  if (slug === "doma-v-natalnoy-karte") return <NatalHouseStudyFigure />;
  return null;
}
