import type { Metadata } from "next";
import Link from "next/link";
import { PRACTICES } from "@/lib/practices";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "ORACLE — символические практики для самопознания",
  description: "Матрица судьбы, Лила, таро и натальная карта как инструмент самопознания — без обещаний предсказать будущее.",
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <main className="page page--wide stack">
      <p className="eyebrow">Символические практики · самопознание</p>
      <h1 className="display">
        Иногда нужен не ответ.
        <br />А другой взгляд.
      </h1>
      <p className="lead">
        ORACLE помогает исследовать личный вопрос через символы матрицы судьбы, Лилы, таро и натальной карты. Мы не предсказываем будущее —
        помогаем увидеть, что происходит сейчас.
      </p>

      <section className="stack" aria-labelledby="practices">
        <h2 id="practices">Практики</h2>
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

      <section className="card card--accent stack">
        <p className="eyebrow">Мой портрет</p>
        <h2>Одна дата рождения — для всех практик</h2>
        <p className="muted">Сохраните дату один раз: каждая новая практика откроется в портрете сразу, без повторного ввода.</p>
        <p>
          <Link className="button" href="/portret">
            Открыть портрет
          </Link>
        </p>
      </section>
    </main>
  );
}
