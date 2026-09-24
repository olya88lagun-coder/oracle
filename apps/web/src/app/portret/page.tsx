import { formatBirthDateRu, toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import Link from "next/link";
import { PRACTICES } from "@/lib/practices";
import { getDb } from "@/server/db";
import { loadPortrait } from "@/server/profile-service";
import { currentUser } from "@/server/viewer";
import { BirthDateForm } from "./BirthDateForm";

export const metadata: Metadata = { title: "Мой портрет" };

function firstName(displayName: string): string {
  return displayName.split(" ")[0] ?? displayName;
}

export default async function PortraitPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <main className="page stack">
        <p className="eyebrow">Мой портрет</p>
        <h1 className="display">Одна дата — для всех практик</h1>
        <p className="lead">
          В портрете хранится дата рождения. Каждая практика ORACLE, которая откроется, возьмёт её отсюда — вводить заново не придётся.
        </p>
        <p>
          <Link className="button" href="/login">
            Войти через VK ID
          </Link>
        </p>
      </main>
    );
  }

  const { birthDate } = await loadPortrait({ db: getDb(), now: () => new Date() }, user.id);
  return (
    <main className="page stack">
      <p className="eyebrow">Мой портрет</p>
      <h1 className="display">Здравствуйте, {firstName(user.displayName)}</h1>

      <section className="card stack" aria-labelledby="birth">
        <h2 id="birth">Дата рождения</h2>
        {birthDate && <p className="lead">{formatBirthDateRu(birthDate)}</p>}
        <BirthDateForm initial={birthDate ? toIsoDate(birthDate) : null} />
      </section>

      <section className="stack" aria-labelledby="practices">
        <h2 id="practices">Практики в портрете</h2>
        <p className="muted">Практики открываются по очереди. Когда откроется следующая, её расчёт появится здесь автоматически.</p>
        <ul className="practice-grid">
          {PRACTICES.map((practice) => (
            <li key={practice.slug} className="practice-card">
              <span className="tag">Скоро</span>
              <h3>{practice.title}</h3>
              <p>{practice.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="row">
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="button button--ghost">
            Выйти
          </button>
        </form>
        <Link href="/portret/delete" className="muted">
          Удалить мои данные
        </Link>
      </div>
    </main>
  );
}
