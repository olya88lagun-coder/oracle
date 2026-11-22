"use client";

import Image from "next/image";
import type { MoonSnapshot } from "@oracle/core/moon";
import Link from "next/link";
import { PosterButton } from "@/components/PosterButton";
import { lunarDayPathOfDate } from "@/lib/lunar-calendar-paths";
import { lunarDayImage, phaseImage, signImage } from "@/lib/moon-images";
import type { MoonToday } from "@/lib/moon-today";
import { moonPosterSpec } from "@/lib/poster-moon";
import { MoonDayAsk } from "./MoonDayAsk";
import { MoonExplorer, type MoonView } from "./MoonExplorer";

// «Живая» часть «Луны сегодня»: диск, плитки фазы, знака, суток и восхода, лента на 14 дней, вопрос дня и три карточки «Что описывает этот день».
// Клиентский компонент: страница передаёт московские данные сервера, а для выбранного города их заменяет пересчёт в браузере (MoonTodayLive).
// Движок расчёта и тексты сюда не импортируются (только типы): они подгружаются лениво
const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });

// Картинка карточки: гравюра, а когда её нет — запасной вариант, обычно крупная цифра
function CardArt({ src, fallback }: { src: string | null; fallback?: string }) {
  return (
    <div className="moon-text__art">
      {src ? <Image src={src} alt="" width={480} height={480} unoptimized loading="lazy" sizes="(min-width: 900px) 320px, 100vw" /> : fallback && <span className="moon-text__numeral">{fallback}</span>}
    </div>
  );
}

function toMoonView(date: string, dateLabel: string, snapshot: MoonSnapshot, phaseName: string): MoonView {
  const { illumination, waxing, phase } = snapshot;
  return { date, dateLabel, illumination, waxing, phase, phaseName };
}

// headingDate — дата в `<h1>` (всегда серверная, московская: её видят поисковики); placeLabel — выбранный город;
// placeNote — «Сейчас в Новосибирске — 23 ноября», когда местная дата отличается от московской
export function MoonTodayView({ today, headingDate, placeLabel = null, placeNote = null }: { today: MoonToday; headingDate: string; placeLabel?: string | null; placeNote?: string | null }) {
  const { snapshot } = today;
  const percent = Math.round(snapshot.illumination * 100);
  const hasTexts = Boolean(today.texts.phase || today.texts.day);
  const question = today.texts.day?.question ?? today.texts.phase?.question;
  const where = placeLabel ? `для города ${placeLabel}` : "по Москве";
  return (
    <>
      <MoonExplorer
        today={toMoonView(today.strip[0]!.date, today.dateLabel, snapshot, today.phaseName)}
        days={today.strip.map(({ date, label, isToday, phaseName, snapshot: daySnapshot }) => ({
          ...toMoonView(date, dayMonth.format(new Date(`${date}T12:00:00+03:00`)), daySnapshot, phaseName),
          label,
          isToday,
        }))}
        ask={question ? <MoonDayAsk date={today.strip[0]!.date} question={question} /> : undefined}
        heading={<><h1>Луна сегодня, {headingDate}</h1><p className="moon-hero__place">{placeLabel ? `Для города ${placeLabel}` : "По Москве"}</p>{placeNote && <p className="moon-hero__note">{placeNote}</p>}</>}
        todayDetails={<>
          <ul className="moon-tiles">
            <li className="moon-tile" data-kind="phase"><span className="moon-tile__label">Фаза</span><span className="moon-tile__value">{today.phaseName}</span><span className="moon-tile__note">{snapshot.waxing ? "растущая" : "убывающая"} · освещено {percent} %</span></li>
            <li className="moon-tile" data-kind="sign"><span className="moon-tile__label">Знак Луны</span><span className="moon-tile__value">{today.signName}</span><span className="moon-tile__note">{Math.floor(snapshot.signDegree)}° знака</span></li>
            <li className="moon-tile" data-kind="day"><span className="moon-tile__label">Лунные сутки</span><span className="moon-tile__value">{today.lunarDay.number}-е</span><span className="moon-tile__note">начались {today.lunarDay.startsLabel}, закончатся {today.lunarDay.endsLabel}</span></li>
            <li className="moon-tile" data-kind="rise"><span className="moon-tile__label">Восход и заход</span><span className="moon-tile__value">{today.rise ?? "—"} / {today.set ?? "—"}</span><span className="moon-tile__note">{where}</span></li>
          </ul>
          <p className="moon-next">Ближайшая смена: {today.next.label}</p>
          <p className="moon-poster moon-poster--pair"><PosterButton spec={moonPosterSpec(today)} /><Link className="button button--ghost" href={lunarDayPathOfDate(today.strip[0]!.date)} prefetch={false}>Страница дня →</Link></p>
        </>}
      />
      {hasTexts && (
        <section className="moon-text" aria-labelledby="moon-text-title">
          <h2 id="moon-text-title">Что описывает этот день</h2>
          {today.texts.phase && <article className="moon-text__block" data-kind="phase"><CardArt src={phaseImage(snapshot.phase, 480)} /><p className="moon-text__eyebrow">Фаза</p><h3>{today.texts.phase.title}</h3><p>{today.texts.phase.text}</p><p className="moon-text__question">{today.texts.phase.question}</p></article>}
          {today.texts.day && <article className="moon-text__block" data-kind="day"><CardArt src={lunarDayImage(today.texts.day.day, 480)} fallback={String(today.texts.day.day)} /><p className="moon-text__eyebrow">Лунные сутки</p><h3>{today.texts.day.day}-е лунные сутки · {today.texts.day.symbol}</h3><p>{today.texts.day.text}</p><p className="moon-text__question">{today.texts.day.question}</p></article>}
          {today.signSummary && <article className="moon-text__block" data-kind="sign"><CardArt src={signImage(snapshot.sign, 480)} /><p className="moon-text__eyebrow">Знак Луны</p><h3>Луна {today.signName}</h3><p>{today.signSummary.text}</p></article>}
        </section>
      )}
    </>
  );
}
