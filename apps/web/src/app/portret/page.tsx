import { formatBirthDateRu, toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Scene } from "@/components/Scene";
import { PRACTICES } from "@/lib/practices";
import { getDb } from "@/server/db";
import { loadPortrait } from "@/server/profile-service";
import { currentUser } from "@/server/viewer";
import { BirthDateForm } from "./BirthDateForm";

export const metadata: Metadata = { title: "Мой портрет" };

function firstName(displayName: string): string {
  return displayName.split(" ")[0] ?? displayName;
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </svg>
  );
}

export default async function PortraitPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <Scene>
        <div className="scene__intro stack">
          <p className="eyebrow eyebrow--line">Мой портрет</p>
          <h1 className="display">Одна дата — для всех практик</h1>
          <p className="lead">
            В портрете хранится дата рождения. Каждая практика, которая откроется на сайте, возьмёт её отсюда — вводить заново не придётся.
          </p>
          <p>
            <Link className="button button--lavender" href="/login">
              Войти через VK ID
            </Link>
          </p>
        </div>
      </Scene>
    );
  }

  const { birthDate } = await loadPortrait({ db: getDb(), now: () => new Date() }, user.id);
  return (
    <Scene>
      <div className="scene__intro stack">
        <p className="eyebrow eyebrow--line">Мой портрет</p>
        <h1 className="display">Здравствуйте, {firstName(user.displayName)}</h1>
      </div>

      <section className="card birth-card" aria-labelledby="birth">
        <div className="birth-card__info">
          <span className="birth-card__icon" aria-hidden="true">
            <CalendarIcon />
          </span>
          <div className="stack">
            <h2 id="birth">Дата рождения</h2>
            {birthDate && <p className="lead">{formatBirthDateRu(birthDate)}</p>}
          </div>
        </div>
        <div className="birth-card__form">
          <BirthDateForm initial={birthDate ? toIsoDate(birthDate) : null} />
        </div>
      </section>

      <section className="stack" aria-labelledby="practices">
        <h2 id="practices">Практики в портрете</h2>
        <p className="muted">Практики открываются по очереди. Когда откроется следующая, её расчёт появится здесь автоматически.</p>
        <ul className="portrait-practices">
          {PRACTICES.map((practice) => (
            <li key={practice.slug} className="portrait-practice">
              <div className="portrait-practice__art">
                <Image src={`/practices/${practice.slug}.webp`} alt="" fill unoptimized sizes="(min-width: 1100px) 25vw, (min-width: 640px) 50vw, 100vw" />
              </div>
              <div className="portrait-practice__body">
                <h3>{practice.title}</h3>
                <p>{practice.summary}</p>
                <span className="tag">Скоро</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="portrait-actions">
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="button button--ghost">
            Выйти
          </button>
        </form>
        <Link href="/portret/delete" className="quiet-link">
          Удалить мои данные
        </Link>
      </div>
    </Scene>
  );
}
