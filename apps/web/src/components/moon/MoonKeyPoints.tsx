import Image from "next/image";
import Link from "next/link";
import { KEY_POINTS_COPY, type KeyPoint } from "@/lib/lunar-calendar";

// «Ключевые точки месяца для самонаблюдения»: четыре карточки с гравюрой знака Луны, временем фазы и вопросом к себе; астрономия и образ знака — по кнопке «Подробнее».
// Без оценок дней и советов.
export function MoonKeyPoints({ items }: { items: readonly KeyPoint[] }) {
  if (items.length === 0) return null;
  return (
    <section className="moon-keypoints" id="moon-key-points" aria-labelledby="moon-keypoints-title">
      <h2 id="moon-keypoints-title">{KEY_POINTS_COPY.title}</h2>
      <p className="moon-events__note">{KEY_POINTS_COPY.note}</p>
      <ol className="moon-keypoints__list">
        {items.map((item) => (
          <li key={`${item.kind}-${item.date}`} className="moon-keypoints__item" data-kind={item.kind} data-image={item.signImage ? "true" : undefined}>
            {item.signImage && <Image className="moon-sign-art" src={item.signImage} alt="" width={480} height={480} unoptimized sizes="(min-width: 900px) 240px, 200px" />}
            <div className="moon-keypoints__body">
              <h3>{item.title}</h3>
              <p className="moon-keypoints__when"><time dateTime={item.date}>{item.label}</time> · Луна {item.signLocative}</p>
              <dl className="moon-keypoints__question">
                <dt>Вопрос для размышления</dt>
                <dd>{item.question}</dd>
              </dl>
              <details className="moon-keypoints__more">
                <summary>Подробнее</summary>
                <dl>
                  <dt>Астрономия</dt>
                  <dd>{item.astronomy}</dd>
                  <dt>Символизм</dt>
                  <dd>{item.symbol}</dd>
                </dl>
              </details>
              {item.action && <Link className="moon-events__action" href={item.action.href}>{item.action.label}</Link>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
