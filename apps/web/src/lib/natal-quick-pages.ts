import type { NatalChart } from "@oracle/core/natal";
import { ANGLE_NAMES, BODY_NAMES, SIGN_NAMES, formatDegrees, inSign } from "./natal-copy";
import { NATAL_PATH } from "./natal-paths";
import { NATAL_KEY_TEXTS, keyTextFor, type NatalKeyRegistry } from "./natal-texts";
import { ANGLE_KEYWORDS, BODY_KEYWORDS, SIGN_KEYWORDS } from "./natal-wheel-card";

// Две страницы быстрых расчётов под отдельные запросы — «асцендент по дате и времени рождения» и «лунный знак по дате рождения».
// В них тот же калькулятор, что на /natalnaya-karta, но с собственным заголовком, текстом, вопросами и ответом вверху результата.
// Все утверждения должны совпадать с тем, как работает калькулятор и что написано на /metodika; без обещаний и предсказаний.

export type QuickVariant = "ascendant" | "moon";
export const QUICK_VARIANTS: readonly QuickVariant[] = ["ascendant", "moon"];

export type QuickSection = { title: string; paragraphs: readonly string[] };
export type QuickFaqItem = { question: string; answer: string };
export type QuickPage = {
  path: string;
  breadcrumb: string;
  metaTitle: string;
  h1: string;
  eyebrow: string;
  description: string;
  lead: string;
  sections: readonly QuickSection[];
  signsTitle: string;
  faq: readonly QuickFaqItem[];
};

export const QUICK_PAGES: Readonly<Record<QuickVariant, QuickPage>> = {
  ascendant: {
    path: `${NATAL_PATH}/ascendent`,
    breadcrumb: "Асцендент",
    metaTitle: "Асцендент по дате, времени и месту рождения: рассчитать онлайн",
    h1: "Асцендент по дате, времени и месту рождения",
    eyebrow: "Быстрый расчёт",
    description: "Рассчитайте свой асцендент онлайн: знак, который поднимался над восточным горизонтом в момент рождения. Нужны дата, время и город. Считается в браузере, без регистрации.",
    lead: "Асцендент — знак, который поднимался над восточным горизонтом в момент вашего рождения. Введите дату, время и город: сверху вы увидите свой асцендент, ниже — всю карту.",
    sections: [
      {
        title: "Что такое асцендент",
        paragraphs: [
          "Асцендент (восходящий знак, ASC) — точка зодиака, которая в момент рождения пересекала восточный горизонт места, где вы родились. В натальной карте он открывает первый дом и служит началом отсчёта для всей схемы: на колесе карты асцендент стоит слева, на «девяти часах».",
          "В символическом языке астрологии асцендент связывают с тем, как человек входит в новые ситуации и какое первое впечатление производит. Вместе со знаками Солнца и Луны он составляет три главные опоры карты, но с первым из них его не стоит смешивать: знак Солнца и асцендент совпадают лишь иногда.",
        ],
      },
      {
        title: "Почему нужны и время, и место",
        paragraphs: [
          "За сутки Земля делает полный оборот, и над горизонтом проходят все двенадцать знаков. В среднем знак сменяется примерно за два часа, а один градус проходит примерно за четыре минуты. Поэтому «около девяти утра» и 9:20 могут дать разный асцендент, а у родившихся в один день, но в разные часы, он разный.",
          "Место нужно по двум причинам: от широты зависит, как быстро знаки поднимаются над горизонтом, а часовой пояс и его историческая смена нужны, чтобы перевести местное время рождения во всемирное. Выбирайте населённый пункт, где вы действительно родились, а не где были прописаны.",
        ],
      },
      {
        title: "Как считает калькулятор",
        paragraphs: [
          "Расчёт идёт в вашем браузере: по дате, времени и месту определяется местное звёздное время, и по нему находится точка эклиптики на восточном горизонте. Результат сверен с эфемеридами Swiss Ephemeris: асцендент, середина неба и границы домов расходятся с ними на доли угловой секунды. Дата, время и место нигде не сохраняются, пока вы сами не решите их сохранить.",
          "Подробнее об устройстве расчёта — на странице «О текстах и методике».",
        ],
      },
      {
        title: "Если время рождения неизвестно",
        paragraphs: [
          "Без времени рождения асцендент определить нельзя. Калькулятор отметит это и построит карту на местный полдень: без асцендента, середины неба и домов. Время часто записано в свидетельстве о рождении или в справке из роддома, его могут помнить родные.",
        ],
      },
    ],
    signsTitle: "Значение асцендента по знакам",
    faq: [
      {
        question: "Как узнать асцендент без времени рождения?",
        answer: "Точно определить нельзя: асцендент меняется примерно каждые два часа, а градус — за четыре минуты. Можно ориентироваться по примерным часам, но это только предположение. Лучше уточнить время по документам или у родных.",
      },
      {
        question: "Асцендент совпадает со знаком Солнца?",
        answer: "Иногда. Солнце за сутки проходит около одного градуса, а асцендент — весь круг знаков. Чаще всего они совпадают у тех, кто родился около рассвета, когда Солнце само поднимается над горизонтом.",
      },
      {
        question: "Чем асцендент отличается от знаков Солнца и Луны?",
        answer: "Знак Солнца и знак Луны — положения этих тел на зодиакальном круге. Асцендент — точка круга на горизонте: она зависит от времени и места рождения, а не от положения какого-либо тела.",
      },
      {
        question: "Это предсказание?",
        answer: "Нет. Асцендент — часть символического языка самопознания: сайт не делает прогнозов и не даёт предсказаний.",
      },
    ],
  },
  moon: {
    path: `${NATAL_PATH}/lunnyy-znak`,
    breadcrumb: "Лунный знак",
    metaTitle: "Лунный знак по дате рождения: рассчитать онлайн",
    h1: "Лунный знак по дате рождения",
    eyebrow: "Быстрый расчёт",
    description: "Узнайте свой лунный знак: в каком знаке зодиака стояла Луна в момент рождения. Нужны дата и город, лучше и время. Считается в браузере, без регистрации.",
    lead: "Лунный знак — знак зодиака, в котором стояла Луна в момент вашего рождения. Она меняет знак примерно каждые два с половиной дня, поэтому по одной дате его определить удаётся не в каждом случае.",
    sections: [
      {
        title: "Что такое лунный знак",
        paragraphs: [
          "В натальной карте Луна — символ эмоциональной жизни: того, что даёт чувство безопасности, как человек откликается на события и заботится о близких. Знак, в котором она стоит, окрашивает эти темы. Лунный знак — одна из трёх опор карты вместе со знаком Солнца и асцендентом.",
          "Знак Луны часто не совпадает со знаком Солнца: Солнце проходит знак за месяц, Луна — за два с половиной дня. Поэтому в одной и той же дате рождения у разных людей лунный знак может отличаться.",
        ],
      },
      {
        title: "Когда достаточно даты, а когда нужно время",
        paragraphs: [
          "Луна — самое быстрое тело карты: за сутки она проходит около 13°. Если в день вашего рождения Луна оставалась в одном знаке, достаточно одной даты. Если в этот день она переходила из знака в знак, знак зависит от часа и минуты рождения.",
          "Когда вы не вводите время, калькулятор считает на местный полдень. Если в этот день Луна меняла знак, он отметит, что знак мог быть другим, и предложит указать время.",
        ],
      },
      {
        title: "Как считается положение Луны",
        paragraphs: [
          "Положение Луны считается в вашем браузере по открытой астрономической библиотеке astronomy-engine и сверено с эфемеридами NASA JPL Horizons и Swiss Ephemeris: расхождение не больше 0,005°. Местное время рождения переводится во всемирное по базе часовых поясов IANA, и для этого нужно место рождения; сама Луна считается для центра Земли.",
          "Дата, время и место нигде не сохраняются, пока вы сами не решите их сохранить. Подробнее об устройстве расчёта — на странице «О текстах и методике».",
        ],
      },
    ],
    signsTitle: "Значение Луны по знакам",
    faq: [
      {
        question: "Можно ли узнать лунный знак только по дате?",
        answer: "Часто да, но не в каждом случае: если в день рождения Луна переходила в другой знак, нужно время. Калькулятор сообщит, мог ли знак быть другим.",
      },
      {
        question: "Какое время вводить: местное или по Гринвичу?",
        answer: "Местное, так, как оно записано в документе. Выберите город рождения: перевод во всемирное время, включая исторические смены часовых поясов, делает калькулятор.",
      },
      {
        question: "Чем лунный знак отличается от знака Солнца?",
        answer: "Знак Солнца — это привычный знак по дате, он меняется раз в месяц. Лунный знак меняется примерно каждые два с половиной дня, поэтому у людей с одной датой он может быть разным.",
      },
      {
        question: "Это предсказание?",
        answer: "Нет. Лунный знак — часть символического языка самопознания: сайт не делает прогнозов и не даёт предсказаний.",
      },
    ],
  },
};

export const quickPageText = (variant: QuickVariant): string => {
  const page = QUICK_PAGES[variant];
  return [page.metaTitle, page.h1, page.description, page.lead, ...page.sections.flatMap((section) => [section.title, ...section.paragraphs]), page.signsTitle, ...page.faq.flatMap((item) => [item.question, item.answer])].join("\n");
};

export function quickFaqJsonLd(variant: QuickVariant): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ru",
    mainEntity: QUICK_PAGES[variant].faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

// ---------- Ответ вверху результата ----------

export type QuickAnswer = { title: string; detail: string | null; text: string; note: string | null; link: { href: string; label: string } | null };

const ASCENDANT_NEEDS_TIME_TEXT = "Асцендент определяется по времени рождения: он меняется примерно каждые два часа. Укажите время рождения и рассчитайте карту заново.";
const MOON_UNCERTAIN_NOTE = "Луна за сутки проходит около 13°, поэтому без времени рождения её знак мог быть другим. Укажите время, чтобы определить его точно.";
const MOON_STABLE_NOTE = "В этот день Луна не меняла знак, поэтому по одной дате знак определён.";

function ascendantAnswer(chart: NatalChart, registry: NatalKeyRegistry): QuickAnswer {
  if (!chart.timeKnown || !chart.ascendant) return { title: "Асцендент определить нельзя", detail: null, text: ASCENDANT_NEEDS_TIME_TEXT, note: null, link: null };
  const { sign, degree } = chart.ascendant;
  const published = keyTextFor("ascendant", sign, registry);
  const name = `${ANGLE_NAMES.ascendant} ${inSign(sign)}`;
  return {
    title: name,
    detail: formatDegrees(degree),
    text: `${capitalize(ANGLE_KEYWORDS.ascendant)}. Ключевые слова знака ${SIGN_NAMES[sign]}: ${SIGN_KEYWORDS[sign]}.`,
    note: null,
    link: published ? { href: published.href, label: `Значение: ${name}` } : null,
  };
}

function moonAnswer(chart: NatalChart, registry: NatalKeyRegistry): QuickAnswer {
  const moon = chart.points.find((point) => point.id === "moon");
  if (!moon) throw new RangeError("В карте нет Луны");
  const published = keyTextFor("moon", moon.sign, registry);
  const name = `${BODY_NAMES.moon} ${inSign(moon.sign)}`;
  const note = chart.timeKnown ? null : chart.uncertainSigns.includes("moon") ? MOON_UNCERTAIN_NOTE : MOON_STABLE_NOTE;
  return {
    title: name,
    detail: chart.timeKnown ? formatDegrees(moon.degree) : null,
    text: `${capitalize(BODY_KEYWORDS.moon)}. Ключевые слова знака ${SIGN_NAMES[moon.sign]}: ${SIGN_KEYWORDS[moon.sign]}.`,
    note,
    link: published ? { href: published.href, label: `Значение: ${name}` } : null,
  };
}

export function quickAnswer(chart: NatalChart, variant: QuickVariant, registry: NatalKeyRegistry = NATAL_KEY_TEXTS): QuickAnswer {
  return variant === "ascendant" ? ascendantAnswer(chart, registry) : moonAnswer(chart, registry);
}

const capitalize = (value: string): string => (value === "" ? value : value[0]?.toUpperCase() + value.slice(1));
