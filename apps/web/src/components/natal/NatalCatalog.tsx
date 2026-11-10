import Link from "next/link";
import { CATALOG_LEAD, CATALOG_TITLE, HOUSES_LEAD, HOUSES_NOTE, HOUSES_TITLE, natalCatalog, natalHouseCatalog, PRIMER_LEAD, PRIMER_LINK } from "@/lib/natal-catalog";

// «Планеты в домах» над каталогом знаков: ссылок мало, поэтому группы открыты сразу, без <details>
export function NatalHouseCatalog() {
  return (
    <nav className="natal-catalog natal-catalog--houses" aria-labelledby="natal-houses-title">
      <h2 id="natal-houses-title">{HOUSES_TITLE}</h2>
      <p className="natal-catalog__lead">{HOUSES_LEAD}</p>
      <div className="natal-catalog__groups">
        {natalHouseCatalog().map((group) => (
          <section key={group.body} className="natal-catalog__group" aria-labelledby={`natal-houses-${group.body}`}>
            <h3 id={`natal-houses-${group.body}`} className="natal-catalog__group-title">{group.title}</h3>
            <ul>
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link className="natal-catalog__link" href={link.href} prefetch={false}>
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="natal-catalog__lead natal-catalog__note">{HOUSES_NOTE}</p>
    </nav>
  );
}

// Каталог значений «планета в знаке» под калькулятором: группы раскрываются без скриптов, а все ссылки есть в разметке сразу.
// Ссылки без предзагрузки, как в таблице результата: браузер не запрашивает сто сорок страниц заранее. Рабочая вёрстка, вид доводит Codex
export function NatalCatalog() {
  return (
    <nav className="natal-catalog" aria-labelledby="natal-catalog-title">
      <h2 id="natal-catalog-title">{CATALOG_TITLE}</h2>
      <p className="natal-catalog__lead">{CATALOG_LEAD}</p>
      <p className="natal-catalog__lead">
        {PRIMER_LEAD}{" "}
        <Link href={PRIMER_LINK.href} prefetch={false}>
          {PRIMER_LINK.text}
        </Link>
        .
      </p>
      <div className="natal-catalog__groups">
        {natalCatalog().map((group) => (
          <details key={group.body} className="natal-catalog__group">
            <summary>{group.title}</summary>
            <ul>
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link className="natal-catalog__link" href={link.href} prefetch={false}>
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </nav>
  );
}
