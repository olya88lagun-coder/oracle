import Link from "next/link";
import { GLOSSARY, glossaryLetters } from "@/lib/natal-glossary";
import { NATAL_PATH } from "@/lib/natal-paths";

// Словарь терминов: указатель по первым буквам и по одному разделу на термин (адрес вида /slovar-terminov#aspekt) — lib/natal-glossary.ts
export function NatalGlossary() {
  const firstIdByLetter = new Map<string, string>();
  for (const entry of GLOSSARY) {
    const letter = entry.term[0]?.toUpperCase() ?? "";
    if (!firstIdByLetter.has(letter)) firstIdByLetter.set(letter, entry.id);
  }
  return (
    <article className="natal-quick natal-glossary">
      <nav className="natal-glossary__letters" aria-label="Указатель по первым буквам">
        {glossaryLetters().map((letter) => (
          <a key={letter} href={`#${firstIdByLetter.get(letter)}`}>
            {letter}
          </a>
        ))}
      </nav>
      {GLOSSARY.map((entry) => (
        <section key={entry.id} id={entry.id} className="natal-quick__section natal-glossary__entry">
          <h2>{entry.term}</h2>
          <p>{entry.definition}</p>
          {entry.links && entry.links.length > 0 && (
            <p className="natal-glossary__links">
              {entry.links.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </p>
          )}
        </section>
      ))}
      <nav className="natal-quick__more" aria-label="Другие страницы">
        <Link href={NATAL_PATH}>Натальная карта онлайн</Link>
        <Link href="/metodika">О текстах и методике</Link>
      </nav>
    </article>
  );
}
