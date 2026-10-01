import { arcanumByNumber } from "@oracle/content";
import { calculateMatrix, formatBirthDateRu, toIsoDate } from "@oracle/core";
import { listLilaGames, listPaidPurchases } from "@oracle/db";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { LogoutButton } from "@/components/LogoutButton";
import { arcanumImage, arcanumPath } from "@/lib/arcana-paths";
import { LILA_GAME_PATH, lilaHistoryPath } from "@/lib/lila-paths";
import { movesLabel } from "@/lib/lila-turn";
import { keyArcana } from "@/lib/matrix-view";
import { PRACTICES, type Practice } from "@/lib/practices";
import { formatIsoDate, reportPath } from "@/lib/report-offer";
import { getDb } from "@/server/db";
import { loadPortrait } from "@/server/profile-service";
import { currentUser } from "@/server/viewer";
import { BirthDateForm } from "./BirthDateForm";

export const metadata: Metadata = { title: "Мой портрет" };

function firstName(displayName: string): string {
  return displayName.split(" ")[0] ?? displayName;
}

// Название действия у каждой практики своё: «Играть» одно на всех здесь не годится
function practiceCommand(practice: Practice, hasKeys: boolean): string {
  switch (practice.slug) {
    case "matrix":
      return hasKeys ? "Открыть матрицу" : "Рассчитать матрицу";
    case "lila":
      return "Играть в Лилу";
    case "compat":
      return "Рассчитать совместимость";
    default:
      return "Открыть Таро";
  }
}

// Исходный фон портрета: женщина и лунный круг справа вверху, к спискам плавно гаснет. Декор, не аватар
function PortraitBackdrop() {
  return (
    <div className="portrait-backdrop" aria-hidden="true">
      <Image src="/portrait.webp" alt="" fill priority unoptimized sizes="(min-width: 900px) 70vw, 100vw" />
    </div>
  );
}

export default async function PortraitPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <main className="workspace portrait-page">
        <PortraitBackdrop />
        <div className="matrix-wrap">
          <div className="guest-portrait">
            <h1>Мой портрет</h1>
            <p>В портрете хранится дата рождения. Каждая практика, которая откроется на сайте, возьмёт её отсюда — вводить заново не придётся.</p>
            <Link className="button button--lavender" href="/login">
              <Icon name="log-in" />
              Войти через VK ID
            </Link>
            <Link className="text-link" href={LILA_GAME_PATH}>
              Играть в Лилу без входа
              <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { birthDate } = await loadPortrait({ db: getDb(), now: () => new Date() }, user.id);
  const keys = birthDate ? keyArcana(calculateMatrix(birthDate)) : null;
  const reports = await listPaidPurchases(getDb(), user.id);
  const games = await listLilaGames(getDb(), user.id);
  return (
    <main className="workspace portrait-page">
      <PortraitBackdrop />
      <div className="matrix-wrap">
        <header className="account-heading">
          <div>
            <h1>Мой портрет</h1>
            <p>Здравствуйте, {firstName(user.displayName)}</p>
          </div>
          <div className="account-actions">
            <LogoutButton />
            <Link href="/portret/delete" className="account-action">
              <Icon name="trash-2" />
              Удалить мои данные
            </Link>
          </div>
        </header>

        <section className="birth-section" aria-labelledby="birth">
          <div>
            <h2 id="birth">Дата рождения</h2>
            <p>Одна дата — для всех практик.</p>
            {birthDate && <p className="birth-section__date">{formatBirthDateRu(birthDate)}</p>}
          </div>
          <BirthDateForm initial={birthDate ? toIsoDate(birthDate) : null} />
        </section>

        <div className="portrait-columns">
          <section aria-labelledby="practices">
            <div className="section-title">
              <h2 id="practices">Мои практики</h2>
            </div>
            <ul className="practice-list">
              {PRACTICES.map((practice) => (
                <li key={practice.slug} className="practice-row">
                  <Image className="practice-row__art" src={`/practices/${practice.slug}.webp`} alt="" width={88} height={100} unoptimized />
                  <div>
                    <h3>{practice.title}</h3>
                    <p>{practice.summary}</p>
                    {practice.slug === "matrix" && keys && (
                      <ul className="portrait-key-list" aria-label="Ключевые арканы">
                        {keys.map((key) => (
                          <li key={key.point}>
                            <Link className="portrait-key" href={arcanumPath(arcanumByNumber(key.number))}>
                              <Image src={arcanumImage(arcanumByNumber(key.number), "thumb")} alt="" width={36} height={43} unoptimized />
                              <span>
                                <small>
                                  {key.label} · {key.number}
                                </small>
                                {key.name}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {practice.href ? (
                    <Link className="practice-command" href={practice.slug === "lila" ? LILA_GAME_PATH : practice.href} aria-label={practiceCommand(practice, keys !== null)} title={practiceCommand(practice, keys !== null)}>
                      <Icon name={practice.slug === "lila" ? "dice-5" : "arrow-up-right"} size={20} />
                    </Link>
                  ) : (
                    <span className="practice-soon">Скоро</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <aside className="portrait-sidebar">
            <section aria-labelledby="games">
              <div className="section-title">
                <h2 id="games">Мои партии</h2>
                <Link href={LILA_GAME_PATH}>Новая партия</Link>
              </div>
              {games.length > 0 ? (
                <ul className="history-list">
                  {games.map((game) => (
                    <li key={game.id}>
                      <span className="history-status">
                        <Icon name={game.status === "active" ? "circle-play" : "check"} />
                        {game.status === "active" ? "Идёт" : "Завершена"} · {game.mode === "guided" ? "с проводником" : "без проводника"}
                      </span>
                      <h3>«{game.intention}»</h3>
                      <p>{movesLabel(game.movesCount)}</p>
                      <Link href={game.status === "active" ? LILA_GAME_PATH : lilaHistoryPath(game.id)}>
                        {game.status === "active" ? "Продолжить партию" : "Открыть партию"}
                        <Icon name="arrow-right" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p className="empty-history">Пока нет партий.</p>
                  <Link className="text-link" href={LILA_GAME_PATH}>
                    Начать партию
                    <Icon name="arrow-right" />
                  </Link>
                </>
              )}
            </section>

            <section aria-labelledby="reports">
              <div className="section-title">
                <h2 id="reports">Разборы</h2>
              </div>
              {reports.length > 0 ? (
                <ul className="history-list">
                  {reports.map((report) => (
                    <li key={report.id}>
                      <span className="history-status">
                        {report.ready ? <Icon name="check" /> : <Icon name="circle-play" />}
                        {report.ready ? "Готов" : "готовится"}
                      </span>
                      <h3>Разбор матрицы судьбы · по дате {formatIsoDate(report.birthDate)}</h3>
                      <Link href={reportPath(report.id)}>
                        Открыть разбор
                        <Icon name="arrow-right" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-history">Пока нет разборов.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
