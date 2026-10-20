import type { ChartPoint, NatalChart } from "@oracle/core/natal";
import { Fragment, type MouseEvent, type PointerEvent } from "react";
import { WHEEL_CAPTION_NO_TIME, formatBirthMeta } from "@/lib/natal-copy";
import { WHEEL_VIEW_SIZE, buildWheel, wheelAriaLabel, type Segment, type WheelModel, type WheelPoint } from "@/lib/natal-wheel";
import { hitTest, relatedBodies, selectionArc, type WheelSelection } from "@/lib/natal-wheel-card";

// Данные рождения для подписей: город, дата ГГГГ-ММ-ДД и время ЧЧ:ММ (null — время неизвестно)
export type NatalBirth = { city: string; date: string; time: string | null };

// Колесо карты: модель из lib/natal-wheel.ts переводится в SVG один к одному, с теми же элементами, классами и data-атрибутами,
// что у принятых natal-wheel.svg и natal-wheel-no-time.svg (без <style>, встроенного шрифта и копии глифов в <defs>:
// стили на сайте подключает natal-wheel.css, глифы лежат в странице один раз, в NatalSprite).
// Обёртка figure.natal-wheel с подписью — как в макете калькулятора.

// Интерактив (его ведёт NatalWheelExplorer): выбранный элемент подсвечивается классами is-selected и is-related, исходная разметка не меняется.
// Без interaction и без выбора колесо побайтово такое же, как принятый рисунок
export type WheelInteraction = {
  selection: WheelSelection | null;
  onHover: (target: WheelSelection | null) => void;
  onTap: (target: WheelSelection | null) => void;
};

const withState = (base: string, ...extra: (string | false | null | undefined)[]): string => [base, ...extra].filter(Boolean).join(" ");

const fixed = (value: number): string => value.toFixed(3);
const segment = ({ x1, y1, x2, y2 }: Segment) => ({ x1: fixed(x1), y1: fixed(y1), x2: fixed(x2), y2: fixed(y2) });

function Leader({ point }: { point: WheelPoint }) {
  const [first, second, third] = point.leader;
  if (!first || !second) return null;
  if (!third) return <line className="wheel-leader" x1={fixed(first.x)} y1={fixed(first.y)} x2={fixed(second.x)} y2={fixed(second.y)} />;
  return <path className="wheel-leader" d={`M${fixed(first.x)} ${fixed(first.y)}L${fixed(second.x)} ${fixed(second.y)}L${fixed(third.x)} ${fixed(third.y)}`} />;
}

function Point({ point, state }: { point: WheelPoint; state: "selected" | "related" | null }) {
  const { glyphBox, retroBox, degree, warning } = point;
  return (
    <>
      <Leader point={point} />
      <circle className="wheel-position" cx={fixed(point.marker.cx)} cy={fixed(point.marker.cy)} r={point.marker.r} data-body={point.body} data-longitude={point.longitudeAttr} />
      <g className={withState("wheel-point", state === "selected" && "is-selected", state === "related" && "is-related")} data-body={point.body} data-retro={String(point.retrograde)} data-longitude={point.longitudeAttr} data-label-longitude={point.labelLongitudeAttr}>
        <title>{point.title}</title>
        <use href={`#${point.glyph}`} x={fixed(glyphBox.x)} y={fixed(glyphBox.y)} width={glyphBox.width} height={glyphBox.height} />
        {retroBox && <use href="#glyph-retro" x={fixed(retroBox.x)} y={fixed(retroBox.y)} width={retroBox.width} height={retroBox.height} />}
        <text className="wheel-point__degree" transform={`translate(${fixed(degree.x)} ${fixed(degree.y)}) rotate(${fixed(degree.rotate)})`}>
          {degree.text}
        </text>
        {warning && (
          <>
            <circle className="wheel-moon-warning" cx={fixed(warning.cx)} cy={fixed(warning.cy)} r={warning.r} />
            <path d={warning.mark} stroke="var(--lavender)" strokeWidth="1.7" />
          </>
        )}
      </g>
    </>
  );
}

function SignsGroup({ model, selectedSign }: { model: WheelModel; selectedSign: string | null }) {
  return (
    <g className="wheel-signs">
      {model.circles.map((circle) => (
        <circle key={circle.r} className={circle.outer ? "wheel-circle wheel-circle--outer" : "wheel-circle"} cx={360} cy={360} r={circle.r} />
      ))}
      {model.ticks.map((tick, index) => (
        <line key={index} className={tick.major ? "wheel-tick wheel-tick--major" : "wheel-tick"} {...segment(tick)} />
      ))}
      {model.signs.map((sign, index) => (
        <Fragment key={sign.sign}>
          <line className="wheel-sector" {...segment(model.sectors[index] as Segment)} />
          <use className={withState("wheel-sign", selectedSign === sign.sign && "is-selected")} href={`#${sign.glyph}`} x={fixed(sign.x)} y={fixed(sign.y)} width={sign.width} height={sign.height} data-sign={sign.sign} />
        </Fragment>
      ))}
    </g>
  );
}

function HousesGroup({ houses, selectedHouse }: { houses: NonNullable<WheelModel["houses"]>; selectedHouse: number | null }) {
  return (
    <g className="wheel-houses">
      {houses.map((house) => (
        <Fragment key={house.house}>
          <line className={house.axis ? "wheel-house-line wheel-house-line--axis" : "wheel-house-line"} {...segment(house.line)} data-house={house.house} data-cusp={house.cuspAttr} />
          {house.extension && <line className="wheel-house-line wheel-house-line--axis" {...segment(house.extension)} opacity={house.extension.opacity} />}
          <text className={withState("wheel-house-number", selectedHouse === house.house && "is-selected")} x={fixed(house.number.x)} y={fixed(house.number.y)} data-house={house.house}>
            {house.number.text}
          </text>
        </Fragment>
      ))}
    </g>
  );
}

function AspectsGroup({ aspects, selectedBody }: { aspects: WheelModel["aspects"]; selectedBody: string | null }) {
  return (
    <g className="wheel-aspects">
      {aspects.map(({ aspect, bodies, opacity, shape }) => {
        const className = withState("wheel-aspect", selectedBody !== null && bodies.some((body) => body === selectedBody) && "is-related");
        return shape.kind === "circle" ? (
          <circle key={`${bodies.join("-")}-${aspect}`} className={className} data-aspect={aspect} cx={fixed(shape.cx)} cy={fixed(shape.cy)} r={shape.r} opacity={opacity} />
        ) : (
          <line key={`${bodies.join("-")}-${aspect}`} className={className} {...segment(shape)} data-aspect={aspect} data-bodies={bodies.join(" ")} opacity={opacity} />
        );
      })}
    </g>
  );
}

const ANGLE_IDS = { asc: "ascendant", mc: "midheaven" } as const;

export function NatalWheel({ chart, birth, interaction }: { chart: NatalChart; birth: NatalBirth; interaction?: WheelInteraction }) {
  const model = buildWheel(chart);
  // Настоящие данные: слово «образца» в подписи колеса появляется только в тестах, где воспроизводится принятый рисунок
  const label = wheelAriaLabel(chart, birth);
  const caption = model.timeKnown ? formatBirthMeta(birth) : WHEEL_CAPTION_NO_TIME;
  const selection = interaction?.selection ?? null;
  const related = selection ? relatedBodies(chart, selection) : null;
  const arc = selection ? selectionArc(chart, selection) : null;
  const pointState = (id: ChartPoint["id"]): "selected" | "related" | null => (selection?.kind === "body" && selection.id === id ? "selected" : related?.has(id) ? "related" : null);

  // Координаты указателя переводятся в единицы viewBox: колесо квадратное, масштаб один по обеим осям
  const targetAt = (event: { currentTarget: SVGSVGElement; clientX: number; clientY: number }): WheelSelection | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return null;
    const scale = WHEEL_VIEW_SIZE / rect.width;
    return hitTest(model, chart, (event.clientX - rect.left) * scale, (event.clientY - rect.top) * scale);
  };
  // Наведение работает только у мыши; пальцем и пером — нажатие
  const handlers = interaction
    ? {
        onPointerMove: (event: PointerEvent<SVGSVGElement>) => event.pointerType === "mouse" && interaction.onHover(targetAt(event)),
        onPointerLeave: (event: PointerEvent<SVGSVGElement>) => event.pointerType === "mouse" && interaction.onHover(null),
        onClick: (event: MouseEvent<SVGSVGElement>) => interaction.onTap(targetAt(event)),
      }
    : {};

  return (
    <figure className={withState("natal-wheel", interaction && "natal-wheel--interactive", selection && "natal-wheel--selected")}>
      <svg viewBox={`0 0 ${WHEEL_VIEW_SIZE} ${WHEEL_VIEW_SIZE}`} role="img" aria-label={label} {...handlers}>
        <title>{label}</title>
        <SignsGroup model={model} selectedSign={selection?.kind === "sign" ? selection.sign : null} />
        {model.houses && <HousesGroup houses={model.houses} selectedHouse={selection?.kind === "house" ? selection.house : null} />}
        {arc && <path className="wheel-highlight" d={arc} />}
        <AspectsGroup aspects={model.aspects} selectedBody={selection?.kind === "body" ? selection.id : null} />
        <g className="wheel-points">
          {model.points.map((point) => (
            <Point key={point.id} point={point} state={pointState(point.id)} />
          ))}
        </g>
        {model.angles &&
          (
            [
              ["asc", model.angles.ascendant],
              ["mc", model.angles.midheaven],
            ] as const
          ).map(([key, angle]) => (
            <Fragment key={key}>
              <text className={withState("wheel-angle", selection?.kind === "angle" && selection.id === ANGLE_IDS[key] && "is-selected")} data-angle={key} x={fixed(angle.text.x)} y={fixed(angle.text.y)}>
                {angle.label}
              </text>
              <circle className="wheel-axis-node" cx={fixed(angle.node.cx)} cy={fixed(angle.node.cy)} r={angle.node.r} />
            </Fragment>
          ))}
        {model.centre && (
          <>
            <circle className="wheel-centre" cx={360} cy={360} r={model.centre.r} />
            <path className="wheel-centre" d={model.centre.cross} />
          </>
        )}
      </svg>
      <figcaption className="natal-wheel__caption">{caption}</figcaption>
    </figure>
  );
}
