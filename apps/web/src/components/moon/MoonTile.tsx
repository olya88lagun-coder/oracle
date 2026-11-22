import Image from "next/image";
import Link from "next/link";
import { SIGN_NAMES } from "@/lib/lunar-calendar";
import { phaseImage } from "@/lib/moon-images";
import { MOON_PATH } from "@/lib/moon-paths";
import type { MoonTileData } from "@/lib/moon-tile";
import { MoonTileStreak } from "./MoonTileStreak";

// Плитка «Луна сегодня» на главной («Портал»): дышащая Луна, факты дня, неделя фазами и вход на «Луну сегодня».
// Данные считаются на сервере; строка серии появляется в браузере (MoonTileStreak). Без цен и без оценок дней
export function MoonTile({ data }: { data: MoonTileData }) {
  const percent = Math.round(data.illumination * 100);
  return (
    <section id="moon-portal" className="moon-portal" aria-labelledby="moon-portal-title">
      <div className="moon-portal__halo" aria-hidden="true">
        <span className="moon-portal__orbit" />
        {data.discImage && <Image src={data.discImage} alt="" width={122} height={122} unoptimized />}
      </div>
      <div className="moon-portal__body">
        <p className="moon-portal__eyebrow">Луна сегодня · {data.dateLabel}</p>
        <h2 id="moon-portal-title">{data.phaseName}, {data.lunarDay.number}-е сутки{data.lunarDay.symbol ? ` «${data.lunarDay.symbol}»` : ""}</h2>
        <p className="moon-portal__text">Луна {data.signName}. {data.until.label}.</p>
        <MoonTileStreak />
        <ul className="moon-portal__chips">
          <li>{percent} % света</li>
          <li>{SIGN_NAMES[data.sign]}</li>
          {data.rise && <li>Восход {data.rise}</li>}
        </ul>
        <ul className="moon-portal__week" aria-label="Фазы Луны на неделю">
          {data.week.map((day) => (
            <li key={day.date} className={`moon-portal__day${day.isToday ? " is-today" : ""}`}>
              {phaseImage(day.phase, 160) && <Image src={phaseImage(day.phase, 160)!} alt="" width={44} height={44} unoptimized />}
              <span>{day.isToday ? "сегодня" : day.label}</span>
            </li>
          ))}
        </ul>
        <p className="moon-portal__cta"><Link className="button button--lavender" href={MOON_PATH}>Открыть Луну сегодня</Link></p>
      </div>
    </section>
  );
}
