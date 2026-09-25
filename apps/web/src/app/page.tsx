import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PRACTICES } from "@/lib/practices";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Твой оракул — символические практики для самопознания",
  description: "Матрица судьбы, Лила, таро и натальная карта как инструмент самопознания — без обещаний предсказать будущее.",
  path: "/",
  absoluteTitle: true,
});

// Картинки заранее ужаты до нужного размера (webp) — оптимизатор Next не нужен, и в standalone-сборке не требуется sharp
export default function HomePage() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero__art">
          <Image src="/hero.webp" alt="" fill priority unoptimized sizes="(min-width: 900px) 60vw, 100vw" />
        </div>
        <div className="hero__text">
          <p className="eyebrow">Символические практики · самопознание</p>
          <h1 className="display">
            Иногда нужен не ответ.
            <br />А другой взгляд.
          </h1>
          <p className="lead">
            «Твой оракул» помогает исследовать личный вопрос через символы матрицы судьбы, Лилы, таро и натальной карты. Мы не предсказываем будущее —
            помогаем увидеть, что происходит сейчас.
          </p>
        </div>
      </section>

      <div className="page page--wide stack">
        <section className="stack" aria-labelledby="practices">
          <h2 id="practices">Практики</h2>
          <ul className="practice-grid">
            {PRACTICES.map((practice) => (
              <li key={practice.slug} className="practice-card">
                <Image className="practice-card__art" src={`/practices/${practice.slug}.webp`} alt="" fill unoptimized sizes="(min-width: 760px) 50vw, 100vw" />
                <div className="practice-card__body">
                  <span className="tag">Скоро</span>
                  <h3>{practice.title}</h3>
                  <p>{practice.summary}</p>
                </div>
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
      </div>
    </main>
  );
}
