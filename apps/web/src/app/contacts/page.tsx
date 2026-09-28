import type { Metadata } from "next";
import Link from "next/link";
import { MATRIX_REPORT_PRICE_KOPECKS } from "@oracle/core";
import { DISCLAIMER, formatRubles, OPERATOR } from "@/lib/legal";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Контакты",
  description: "Кто стоит за сайтом «Твой оракул» и как связаться: исполнитель, ИНН, почта, платные услуги и цены.",
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
          «Твой оракул» — пространство символических практик для самопознания: матрица судьбы, Лила, таро и натальная карта. Практики открываются по
          очереди; дату рождения можно заранее сохранить в <Link href="/portret">портрете</Link>.
        </p>
        <h2>Услуги и оплата</h2>
        <p>
          «Разбор матрицы судьбы» — персональный текстовый разбор матрицы по дате рождения: семь глав о личности и центре, задаче, отношениях,
          деньгах и деле, роде, предназначениях и итоговый сценарий. Стоимость — {formatRubles(MATRIX_REPORT_PRICE_KOPECKS)}.
        </p>
        <p>
          Разбор покупается на странице <Link href="/matrica-sudby">матрицы судьбы</Link> после входа через VK ID. Оплата — на странице ЮKassa способами,
          которые она предлагает. Разбор готов через 1–2 минуты после оплаты и хранится в «Моём портрете». Чек «Мой налог» приходит на e-mail,
          указанный при покупке. Условия, порядок оказания и возвраты — в <Link href="/oferta">оферте</Link>.
        </p>
        <p className="muted">{DISCLAIMER}</p>
      </article>
    </main>
  );
}
