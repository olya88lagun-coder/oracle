import type { NatalChart } from "@oracle/core/natal";
import { Fragment } from "react";
import { WHEEL_CAPTION_NO_TIME, formatBirthMeta } from "@/lib/natal-copy";
import { WHEEL_VIEW_SIZE, buildWheel, wheelAriaLabel, type Segment, type WheelModel, type WheelPoint } from "@/lib/natal-wheel";

// Данные рождения для подписей: город, дата ГГГГ-ММ-ДД и время ЧЧ:ММ (null — время неизвестно)
export type NatalBirth = { city: string; date: string; time: string | null };

// Колесо карты: модель из lib/natal-wheel.ts переводится в SVG один к одному, с теми же элементами, классами и data-атрибутами,
// что у принятых natal-wheel.svg и natal-wheel-no-time.svg (без <style>, встроенного шрифта и копии глифов в <defs>:
// стили на сайте подключает natal-wheel.css, глифы лежат в странице один раз, в NatalSprite).
// Обёртка figure.natal-wheel с подписью — как в макете калькулятора.

const fixed = (value: number): string => value.toFixed(3);
const segment = ({ x1, y1, x2, y2 }: Segment) => ({ x1: fixed(x1), y1: fixed(y1), x2: fixed(x2), y2: fixed(y2) });

function Leader({ point }: { point: WheelPoint }) {
  const [first, second, third] = point.leader;
  if (!first || !second) return null;
  if (!third) return <line className="wheel-leader" x1={fixed(first.x)} y1={fixed(first.y)} x2={fixed(second.x)} y2={fixed(second.y)} />;
  return <path className="wheel-leader" d={`M${fixed(first.x)} ${fixed(first.y)}L${fixed(second.x)} ${fixed(second.y)}L${fixed(third.x)} ${fixed(third.y)}`} />;
}

function Point({ point }: { point: WheelPoint }) {
  const { glyphBox, retroBox, degree, warning } = point;
  return (
    <>
      <Leader point={point} />
      <circle className="wheel-position" cx={fixed(point.marker.cx)} cy={fixed(point.marker.cy)} r={point.marker.r} data-body={point.body} data-longitude={point.longitudeAttr} />
      <g className="wheel-point" data-body={point.body} data-retro={String(point.retrograde)} data-longitude={point.longitudeAttr} data-label-longitude={point.labelLongitudeAttr}>
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

function SignsGroup({ model }: { model: WheelModel }) {
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
          <use className="wheel-sign" href={`#${sign.glyph}`} x={fixed(sign.x)} y={fixed(sign.y)} width={sign.width} height={sign.height} data-sign={sign.sign} />
        </Fragment>
      ))}
    </g>
  );
}

function HousesGroup({ houses }: { houses: NonNullable<WheelModel["houses"]> }) {
  return (
    <g className="wheel-houses">
      {houses.map((house) => (
        <Fragment key={house.house}>
          <line className={house.axis ? "wheel-house-line wheel-house-line--axis" : "wheel-house-line"} {...segment(house.line)} data-house={house.house} data-cusp={house.cuspAttr} />
          {house.extension && <line className="wheel-house-line wheel-house-line--axis" {...segment(house.extension)} opacity={house.extension.opacity} />}
          <text className="wheel-house-number" x={fixed(house.number.x)} y={fixed(house.number.y)} data-house={house.house}>
            {house.number.text}
          </text>
        </Fragment>
      ))}
    </g>
  );
}

function AspectsGroup({ aspects }: { aspects: WheelModel["aspects"] }) {
  return (
    <g className="wheel-aspects">
      {aspects.map(({ aspect, bodies, opacity, shape }) =>
        shape.kind === "circle" ? (
          <circle key={`${bodies.join("-")}-${aspect}`} className="wheel-aspect" data-aspect={aspect} cx={fixed(shape.cx)} cy={fixed(shape.cy)} r={shape.r} opacity={opacity} />
        ) : (
          <line key={`${bodies.join("-")}-${aspect}`} className="wheel-aspect" {...segment(shape)} data-aspect={aspect} data-bodies={bodies.join(" ")} opacity={opacity} />
        ),
      )}
    </g>
  );
}

export function NatalWheel({ chart, birth }: { chart: NatalChart; birth: NatalBirth }) {
  const model = buildWheel(chart);
  // Настоящие данные: слово «образца» в подписи колеса появляется только в тестах, где воспроизводится принятый рисунок
  const label = wheelAriaLabel(chart, birth);
  const caption = model.timeKnown ? formatBirthMeta(birth) : WHEEL_CAPTION_NO_TIME;

  return (
    <figure className="natal-wheel">
      <svg viewBox={`0 0 ${WHEEL_VIEW_SIZE} ${WHEEL_VIEW_SIZE}`} role="img" aria-label={label}>
        <title>{label}</title>
        <SignsGroup model={model} />
        {model.houses && <HousesGroup houses={model.houses} />}
        <AspectsGroup aspects={model.aspects} />
        <g className="wheel-points">
          {model.points.map((point) => (
            <Point key={point.id} point={point} />
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
              <text className="wheel-angle" data-angle={key} x={fixed(angle.text.x)} y={fixed(angle.text.y)}>
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
