import { NATAL_PATH } from "./natal-paths";

// Мост с лунных страниц к натальной карте: человек видит чужую (общую для всех) Луну и идёт узнать свою.
// Ведём на быстрый расчёт лунного знака: он короткий, бесплатный, а под результатом стоит блок платного разбора карты
export type BridgeFrom = "today" | "month" | "weekday";

export const MOON_SIGN_PATH = `${NATAL_PATH}/lunnyy-znak`;

export type BridgeCopy = { eyebrow: string; title: string; text: string; cta: string; href: string };

const NOTE = "Бесплатно, без регистрации. Расчёт идёт в вашем браузере.";
export const BRIDGE_NOTE = NOTE;

// signName — «в Овне»: сегодняшний знак Луны, как он записан на странице
export function bridgeCopy(from: BridgeFrom, signName?: string): BridgeCopy {
  if (from === "today") {
    return {
      eyebrow: "Ваша Луна",
      title: "Сегодняшняя Луна одна для всех. Ваша — в карте рождения",
      text: `Сегодня Луна ${signName ?? "в одном из знаков"}. А в натальной карте Луна описывает вашу эмоциональную жизнь: то, что даёт чувство опоры. Её знак зависит от даты, времени и места рождения.`,
      cta: "Узнать свою Луну",
      href: MOON_SIGN_PATH,
    };
  }
  if (from === "month") {
    return {
      eyebrow: "Ваша Луна",
      title: "Календарь показывает небо. Карта рождения — вас",
      text: "Луна в календаре одна для всех. Ваша собственная стоит в том знаке, где была в момент рождения. Введите дату, место и, если знаете, время.",
      cta: "Узнать свою Луну",
      href: MOON_SIGN_PATH,
    };
  }
  return {
    eyebrow: "Ваша карта",
    title: "У дня одна планета, у вас — вся карта",
    text: "Планета дня — общий образ для всех. В натальной карте у каждого свои положения Солнца, Луны и планет: они зависят от даты, времени и места рождения.",
    cta: "Рассчитать карту",
    href: NATAL_PATH,
  };
}
