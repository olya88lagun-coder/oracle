import { ARCANA } from "@oracle/content";
import Image from "next/image";
import Link from "next/link";
import { arcanumImage } from "@/lib/arcana-paths";
import { yearArcanumPath } from "@/lib/year-arcana";

// Статический каталог на странице аркана года: ответ виден и без расчёта, а каждая ссылка ведёт на полное значение аркана
export function YearArcanaCatalog() {
  return (
    <section className="year-catalog" aria-labelledby="year-catalog-title">
      <p className="eyebrow">Справочник</p>
      <h2 id="year-catalog-title">Все 22 аркана года</h2>
      <p className="year-catalog__lead">
        Уже знаете свой аркан или хотите понять, как читается другой символ? Откройте значение аркана как темы года: что поддерживает, на что обратить внимание, отношения, дело и вопрос года. Это справочник для размышления, не прогноз.
      </p>
      <ul className="year-catalog__grid">
        {ARCANA.map((arcanum) => (
          <li key={arcanum.number}>
            <Link href={yearArcanumPath(arcanum)} prefetch={false}>
              <Image className="year-catalog__art" src={arcanumImage(arcanum, "thumb")} alt="" width={160} height={160} unoptimized />
              <span className="year-catalog__number">{String(arcanum.number).padStart(2, "0")}</span>
              <span className="year-catalog__name">{arcanum.name}</span>
              <span className="year-catalog__keys">{arcanum.keywords.join(" · ")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
