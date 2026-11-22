import Link from "next/link";
import { formatDegrees, SIGN_NAMES } from "@/lib/natal-copy";
import { keyTextFor } from "@/lib/natal-texts";
import { DEMO_NATAL_CHART_DATA } from "@/server/product-demos";

// Серверный учебный пример на том же условном моменте, что и полный пример разбора.
// Положения берутся из расчёта ядра; форма и данные посетителя здесь не используются.
export function NatalReadingExample() {
  const { chart, birth } = DEMO_NATAL_CHART_DATA;
  const sun = chart.points.find((point) => point.id === "sun")!;
  const moon = chart.points.find((point) => point.id === "moon")!;
  const rows = [
    { name: "Солнце", point: sun, meaning: keyTextFor("sun", sun.sign), text: "С чего начать чтение: в символической трактовке Солнце связывают с самовыражением и тем, чему вы готовы уделять силы." },
    { name: "Луна", point: moon, meaning: keyTextFor("moon", moon.sign), text: "Следующий вопрос — о привычных реакциях и ощущении безопасности. Сравните эту тему с Солнцем, не сводя всю карту к одному знаку." },
    { name: "Асцендент", point: chart.ascendant!, meaning: keyTextFor("ascendant", chart.ascendant!.sign), text: "Эту точку связывают со способом входить в новую ситуацию. Она зависит от времени и места рождения: одной даты для расчёта недостаточно." },
  ];

  return (
    <section className="natal-guide natal-reading-example" aria-labelledby="natal-reading-title">
      <h2 id="natal-reading-title">Как читать натальную карту: пример с расшифровкой</h2>
      <p>
        Начните с нескольких положений, а не со всех линий колеса сразу. Ниже — учебный пример: {birth.city}, 7 марта 1990 года, {birth.time} по местному времени.
        Это условные данные, а не результат вашей формы. Расчёт тот же, что у калькулятора выше.
      </p>
      <ol className="natal-reading-example__points">
        {rows.map((row) => (
          <li key={row.name}>
            <h3>{row.name}</h3>
            <p className="natal-reading-example__position">{SIGN_NAMES[row.point.sign]} · {formatDegrees(row.point.degree)}</p>
            <p>{row.text}</p>
            {row.meaning && <Link className="touch-link" href={row.meaning.href} prefetch={false}>Значение положения</Link>}
          </li>
        ))}
      </ol>
      <p>
        Затем посмотрите дом: он обозначает тему жизни, к которой относится положение. Например, 7-й дом связывают с партнёрством и договорённостями,
        а не с обещанием брака. Аспект — угловое расстояние между планетами; он помогает рассматривать их темы вместе. Точные определения есть в{" "}
        <Link href="/natalnaya-karta/slovar-terminov" prefetch={false}>словаре терминов натальной карты</Link>.
      </p>
      <p>
        Не узнаёте себя в описании — не нужно подгонять под него свой опыт. Выберите один вопрос из страницы значения и сопоставьте его с конкретной
        ситуацией. Астрономические положения можно вычислить; символическая трактовка не служит доказательством черт характера или будущих событий.
      </p>
      <p>
        Без известного времени рождения смотрите знаки планет с указанными ограничениями: асцендента и домов не будет, знак Луны в день перехода
        может быть неопределённым. <Link href="/metodika">Как устроен расчёт</Link>.
      </p>
      <p>
        На тех же условных данных можно прочитать <Link href="/natalnaya-karta/primer" prefetch={false}>полный пример разбора натальной карты</Link>.
        Для своей карты вернитесь к форме выше: бесплатный результат доступен без регистрации.
      </p>
    </section>
  );
}
