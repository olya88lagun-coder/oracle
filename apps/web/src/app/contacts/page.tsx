import type { Metadata } from "next";
import Link from "next/link";
import { DISCLAIMER, OPERATOR } from "@/lib/legal";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Контакты",
  description: "Кто стоит за ORACLE и как связаться: исполнитель, ИНН, почта.",
  path: "/contacts",
});

export default function ContactsPage() {
  return (
    <main className="page">
      <article className="stack">
        <h1 className="display">Контакты</h1>
        <h2>Исполнитель</h2>
        <p>{OPERATOR.name}, самозанятая (плательщик налога на профессиональный доход). ИНН {OPERATOR.inn}.</p>
        <p>
          Почта: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. Отвечаем в течение двух рабочих дней.
        </p>
        <h2>Что это за сайт</h2>
        <p>
          ORACLE — пространство символических практик для самопознания: матрица судьбы, Лила, таро и натальная карта. Практики открываются по
          очереди; дату рождения можно заранее сохранить в <Link href="/portret">портрете</Link>.
        </p>
        <h2>Платные услуги</h2>
        <p>Сейчас на сайте нет платных услуг. Когда они появятся, здесь будут их описание и цены.</p>
        <p className="muted">{DISCLAIMER}</p>
      </article>
    </main>
  );
}
