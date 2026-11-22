import { dayOrdinal } from "./day-ordinal";
import { signImage } from "./moon-images";
import type { MoonToday } from "./moon-today";

// Спека картинки «Луна сегодня» для сторис: фаза, знак, лунные сутки, восход и заход по Москве. Личных данных в ней нет: всё одинаково для всех
export type MoonPosterSpec = {
  moon: "today";
  title: string;
  dateLabel: string;
  illumination: number;
  waxing: boolean;
  phaseName: string;
  signImage: string | null;
  signLine: string;
  dayLine: string;
  rise: string | null;
  set: string | null;
  footer: string;
  fileName: string;
};

export function moonPosterSpec(today: MoonToday): MoonPosterSpec {
  const { illumination, waxing, sign } = today.snapshot;
  return {
    moon: "today",
    title: "Луна сегодня",
    dateLabel: today.dateLabel,
    illumination,
    waxing,
    phaseName: today.phaseName,
    signImage: signImage(sign, 960),
    signLine: `Луна ${today.signName}`,
    dayLine: `${dayOrdinal(today.lunarDay.number)} лунные сутки`,
    rise: today.rise,
    set: today.set,
    footer: "ТВОЙ ОРАКУЛ · TVOY-ORAKUL.RU",
    fileName: "luna-segodnya",
  };
}
