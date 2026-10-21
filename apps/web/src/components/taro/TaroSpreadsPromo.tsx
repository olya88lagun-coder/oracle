import Link from "next/link";
import { countLabel } from "@/lib/taro-catalog";
import { TARO_SPREADS_PATH } from "@/lib/taro-paths";
import { spreadPath, TARO_SPREADS } from "@/lib/taro-spreads";
import { SpreadGlyph } from "./SpreadGlyph";

// Предложение раскладов под первым экраном /taro: плитка на каждый расклад с рисунком его раскладки
export function TaroSpreadsPromo() {
  return (
    <section className="matrix-wrap taro-spreads-promo" aria-labelledby="taro-spreads-promo-title">
      <div className="taro-spreads-promo__head">
        <h2 id="taro-spreads-promo-title">Расклады Таро</h2>
        <p>Выберите тему, вытяните карты и прочитайте, что каждая из них говорит в своей позиции. Бесплатно и без регистрации.</p>
      </div>
      <ul className="taro-spreads-promo__list">
        {TARO_SPREADS.map((spread) => (
          <li key={spread.slug}>
            <Link className="taro-spread-tile" href={spreadPath(spread)} aria-label={`Сделать расклад: ${spread.name}`}>
              <span className="taro-spread-tile__art">
                <SpreadGlyph slug={spread.slug} />
              </span>
              <span className="taro-spread-tile__text">
                <span className="eyebrow">{countLabel(spread.positions.length)}</span>
                <strong>{spread.short}</strong>
                <span className="taro-spread-tile__teaser">{spread.teaser}</span>
                <span className="taro-spread-tile__go" aria-hidden="true">
                  Сделать расклад →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link className="matrix-link" href={TARO_SPREADS_PATH}>
        Все расклады Таро
      </Link>
    </section>
  );
}
