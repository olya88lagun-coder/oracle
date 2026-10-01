import type { Metadata } from "next";
import Link from "next/link";
import { LILA_SESSION_PRICE_KOPECKS, MATRIX_REPORT_PRICE_KOPECKS } from "@oracle/core";
import { DocumentPage, type DocumentSection } from "@/components/document/DocumentPage";
import { DISCLAIMER, formatRubles, OPERATOR } from "@/lib/legal";
import { publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Контакты",
  description: "Кто стоит за сайтом «Твой оракул» и как связаться: исполнитель, ИНН, почта, платные услуги и цены.",
  path: "/contacts",
  image: SITE_PREVIEW_IMAGE,
});

export default function ContactsPage() {
  const sections: DocumentSection[] = [
    {
      title: "Исполнитель",
      className: "contact-primary",
      body: (
        <>
          <p>{OPERATOR.name}, самозанятая (плательщик налога на профессиональный доход). ИНН {OPERATOR.inn}.</p>
          <p className="contact-mail">
            <span className="contact-caption">Почта: </span>
            <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.<span className="contact-response"> Отвечаем в течение двух рабочих дней.</span>
          </p>
        </>
      ),
    },
    {
      title: "Что это за сайт",
      body: (
        <p>
          «Твой оракул» — пространство символических практик для самопознания: матрица судьбы, Лила, таро и натальная карта. Практики открываются по
          очереди; дату рождения можно заранее сохранить в <Link href="/portret">портрете</Link>.
        </p>
      ),
    },
    {
      title: "Услуги и оплата",
      className: "contact-services",
      body: (
        <>
          <p>
            «Разбор матрицы судьбы» — персональный текстовый разбор матрицы по дате рождения: семь глав о личности и центре, задаче, отношениях,
            деньгах и деле, роде, предназначениях и итоговый сценарий. Стоимость — {formatRubles(MATRIX_REPORT_PRICE_KOPECKS)}.
          </p>
          <p>
            Разбор покупается на странице <Link href="/matrica-sudby">матрицы судьбы</Link> после входа через VK ID. Оплата — на странице ЮKassa способами,
            которые она предлагает. Разбор готов в течение нескольких минут после оплаты и хранится в «Моём портрете». Чек «Мой налог» приходит на e-mail,
            указанный при покупке. Условия, порядок оказания и возвраты — в <Link href="/oferta">оферте</Link>.
          </p>
          <p>
            «Сессия Лилы с проводником» — одна партия игры «Лила» с короткими абзацами проводника на ходах и итоговым выводом с файлом PDF. Стоимость —{" "}
            {formatRubles(LILA_SESSION_PRICE_KOPECKS)} за партию. Оплата — до начала партии, на странице <Link href="/lila/igra">игры</Link>, после входа
            через VK ID; чек и условия возврата — как для разбора, подробности в <Link href="/oferta">оферте</Link>.
          </p>
        </>
      ),
    },
  ];
  return <DocumentPage current="/contacts" title="Контакты" sections={sections} footnote={<p className="muted">{DISCLAIMER}</p>} wide />;
}
