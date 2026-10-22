import Link from "next/link";
import { CATALOG_LEAD, CATALOG_TITLE, natalCatalog, PRIMER_LEAD, PRIMER_LINK } from "@/lib/natal-catalog";

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
