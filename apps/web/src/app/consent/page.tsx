import type { Metadata } from "next";
import Link from "next/link";
import { DATA_STORAGE, DISCLAIMER, LEGAL_DATE, LEGAL_VERSIONS, LOGIN_CONSENT_RECIPIENTS, OPERATOR } from "@/lib/legal";
import { publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = publicMetadata({
  title: "Согласие на обработку персональных данных",
  description: "Текст согласия на обработку персональных данных, которое даётся при входе в ORACLE.",
  path: "/consent",
});

export default function ConsentPage() {
  const host = new URL(SITE_URL).host;
  return (
    <main className="page">
      <article className="stack">
        <h1 className="display">Согласие на обработку персональных данных</h1>
        <p className="muted">
          Редакция {LEGAL_VERSIONS.consent} от {LEGAL_DATE}
        </p>
        <p>
          Отмечая согласие на сайте {host}, я свободно, своей волей и в своём интересе даю {OPERATOR.name} (ИНН {OPERATOR.inn}, далее —
          оператор) согласие на обработку моих персональных данных на условиях ниже и <Link href="/privacy">политики обработки персональных данных</Link>.
        </p>
        <h2>Какие данные</h2>
        <p>Идентификатор и имя в VK ID; дата рождения, если я сохраню её в портрете; дата и время согласия.</p>
        <h2>Зачем</h2>
        <p>Чтобы входить на сайт, хранить мою дату рождения и показывать мне расчёты символических практик в портрете.</p>
        <h2>Что с ними делают</h2>
        <p>
          Сбор, запись, систематизация, хранение, уточнение, использование, удаление. Данные хранятся {DATA_STORAGE}.{" "}
          {LOGIN_CONSENT_RECIPIENTS.length === 0 ? "Для работы сайта данные третьим лицам не передаются." : "Для работы сайта данные передаются:"}
        </p>
        {LOGIN_CONSENT_RECIPIENTS.length > 0 && (
          <ul>
            {LOGIN_CONSENT_RECIPIENTS.map((recipient) => (
              <li key={recipient.name}>
                {recipient.name} — {recipient.what}; {recipient.why}.
              </li>
            ))}
          </ul>
        )}
        <p>Другим лицам данные не передаются, кроме случаев, предусмотренных законом. На Яндекс.Метрику согласие даётся отдельно — в баннере cookie.</p>
        <h2>Срок и отзыв</h2>
        <p>
          Согласие действует до отзыва. Отозвать его и удалить данные можно на странице <Link href="/portret/delete">«Удалить мои данные»</Link>{" "}
          или письмом на <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a> — по письму данные удаляются в течение 30 дней.
        </p>
        <p className="muted">{DISCLAIMER}</p>
      </article>
    </main>
  );
}
