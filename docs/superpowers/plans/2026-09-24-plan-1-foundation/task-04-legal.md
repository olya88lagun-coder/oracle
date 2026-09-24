# Задача 4 — Документы и подвал: политика, согласие, контакты, оговорка

**Files:**
- Create: `apps/web/src/lib/legal.ts`; Test: `apps/web/src/lib/legal.test.ts`
- Create: `apps/web/src/app/privacy/page.tsx`, `apps/web/src/app/consent/page.tsx`, `apps/web/src/app/contacts/page.tsx`
- Create: `apps/web/src/components/Footer.tsx`
- Modify: `apps/web/src/app/layout.tsx` (подвал после `children`)
- Modify: `apps/web/src/lib/seo.ts` (документы в `PUBLIC_PATHS`), `apps/web/src/lib/seo.test.ts`

**Interfaces:**
- Consumes: `publicMetadata`, `PUBLIC_PATHS` из `@/lib/seo` (задача 3).
- Produces:
  - `OPERATOR = { name, inn, email }`
  - `LEGAL_VERSIONS = { consent: "2026-09-v1", privacy: "2026-09-v1" }`; `LEGAL_DATE: string`; `DATA_STORAGE: string`
  - `type DataRecipient = { name: string; what: string; why: string }`; `DATA_RECIPIENTS`; `LOGIN_CONSENT_RECIPIENTS` (без Метрики)
  - `DOCUMENT_PATHS = ["/contacts", "/privacy", "/consent"] as const`
  - `DISCLAIMER: string` — оговорка о характере сервиса
  - компонент `Footer` (задача 7 добавит в него кнопку «Настройки cookie»)

## Зачем

Вход через VK ID создаёт пользователя и хранит дату рождения — это обработка персональных данных по 152-ФЗ. Нужны политика и текст согласия до первого входа (задача 5 ссылается на них из формы входа). Контакты оператора нужны для доверия, а в плане 2 — для подключения ЮKassa.

Спецификация 2: «не обещаем будущего». Оговорка об этом стоит в подвале каждой страницы и в согласии.

Оператор тот же, что у Граней: самозанятая, данные взяты из `C:\dev\grani-test\apps\web\src\lib\legal.ts` (они и так опубликованы на grani-test.ru). **Перед коммитом спросить владелицу, та же ли почта для ORACLE** — если нет, заменить `email`.

В плане 1 сайт никому не передаёт данные, кроме Яндекс.Метрики (только с согласия на cookie). ЮKassa и GigaChat появятся в плане 2 вместе с новой редакцией политики и согласия.

## Шаги

- [ ] **Шаг 1. Тест (RED).** `apps/web/src/lib/legal.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { DATA_RECIPIENTS, DISCLAIMER, DOCUMENT_PATHS, LEGAL_VERSIONS, LOGIN_CONSENT_RECIPIENTS, OPERATOR } from "./legal";

describe("legal constants", () => {
  test("the operator has a name, a 12-digit INN of a self-employed person and an e-mail", () => {
    expect(OPERATOR.name.split(" ")).toHaveLength(3);
    expect(OPERATOR.inn).toMatch(/^\d{12}$/);
    expect(OPERATOR.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
  });

  test("document versions share one format", () => {
    for (const version of Object.values(LEGAL_VERSIONS)) expect(version).toMatch(/^\d{4}-\d{2}-v\d+$/);
  });

  test("every recipient says what it receives and why", () => {
    for (const recipient of DATA_RECIPIENTS) {
      expect(recipient.name.length).toBeGreaterThan(0);
      expect(recipient.what.length).toBeGreaterThan(0);
      expect(recipient.why.length).toBeGreaterThan(0);
    }
  });

  test("Metrika is consented to separately in the cookie banner, not at login", () => {
    expect(DATA_RECIPIENTS.map((recipient) => recipient.name)).toContain("Яндекс.Метрика");
    expect(LOGIN_CONSENT_RECIPIENTS.map((recipient) => recipient.name)).not.toContain("Яндекс.Метрика");
  });

  test("the disclaimer rules out predictions and professional advice", () => {
    expect(DISCLAIMER).toMatch(/не предсказани/);
    expect(DISCLAIMER).toMatch(/консультаци/);
  });

  test("documents live at stable addresses", () => {
    expect(DOCUMENT_PATHS).toEqual(["/contacts", "/privacy", "/consent"]);
  });
});
```

В `apps/web/src/lib/seo.test.ts` в блок `describe("paths", ...)` добавить:

```ts
  test("documents are public", () => {
    expect(PUBLIC_PATHS).toEqual(expect.arrayContaining(["/contacts", "/privacy", "/consent"]));
  });
```

Запуск: `pnpm vitest run apps/web/src/lib`. Ожидается FAIL: `./legal` не найден, документов нет в `PUBLIC_PATHS`.

- [ ] **Шаг 2. Константы.** `apps/web/src/lib/legal.ts`:

```ts
// Оператор персональных данных — самозанятая, указана так же, как в «Мой налог»
export const OPERATOR = { name: "Лагутенкова Ольга Валентиновна", inn: "744923234850", email: "lagutenkova.olga@yandex.ru" } as const;

export const LEGAL_VERSIONS = { consent: "2026-09-v1", privacy: "2026-09-v1" } as const;
export const LEGAL_DATE = "24 сентября 2026 года";

export const DATA_STORAGE = "на сервере в Москве (Timeweb Cloud)";

export const DOCUMENT_PATHS = ["/contacts", "/privacy", "/consent"] as const;

export const DISCLAIMER =
  "ORACLE — инструмент самопознания. Трактовки символических практик — не предсказания и не медицинская, психологическая, юридическая или финансовая консультация.";

export type DataRecipient = { name: string; what: string; why: string };

// Кому и что уходит. Политика и согласие читают один список, чтобы они не расходились.
// ЮKassa и сервис ИИ добавятся вместе с платными разборами (план 2) — с новой редакцией документов
export const DATA_RECIPIENTS: readonly DataRecipient[] = [
  {
    name: "Яндекс.Метрика",
    what: "обезличенные данные о посещении: cookie, просмотренные страницы, устройство",
    why: "статистика посещений — только если вы приняли cookie",
  },
];

// Метрика включается отдельным согласием в cookie-баннере, поэтому в согласии при входе её нет
export const LOGIN_CONSENT_RECIPIENTS = DATA_RECIPIENTS.filter((recipient) => recipient.name !== "Яндекс.Метрика");
```

В `apps/web/src/lib/seo.ts` заменить объявление `PUBLIC_PATHS`:

```ts
import { DOCUMENT_PATHS } from "./legal";

// Страницы практик добавляют следующие планы
export const PUBLIC_PATHS: string[] = ["/", ...DOCUMENT_PATHS];
```

(импорт — к остальным импортам вверху файла, прежний комментарий над `PUBLIC_PATHS` удалить).

Запуск: `pnpm vitest run apps/web/src/lib`. Ожидается PASS.

- [ ] **Шаг 3. Страницы.** `apps/web/src/app/privacy/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { DATA_RECIPIENTS, DATA_STORAGE, LEGAL_DATE, LEGAL_VERSIONS, OPERATOR } from "@/lib/legal";
import { publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = publicMetadata({
  title: "Политика обработки персональных данных",
  description: "Какие данные собирает ORACLE, зачем, кому передаёт, где хранит и как их удалить.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const host = new URL(SITE_URL).host;
  return (
    <main className="page">
      <article className="stack">
        <h1 className="display">Политика обработки персональных данных</h1>
        <p className="muted">
          Редакция {LEGAL_VERSIONS.privacy} от {LEGAL_DATE}
        </p>
        <p>
          Политика описывает, как сайт {host} обрабатывает персональные данные, и составлена по Федеральному закону от 27.07.2006 № 152-ФЗ
          «О персональных данных».
        </p>

        <h2>1. Оператор</h2>
        <p>
          {OPERATOR.name}, самозанятая, ИНН {OPERATOR.inn}. Почта для вопросов о данных: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
        </p>

        <h2>2. Какие данные обрабатываются</h2>
        <ul>
          <li>идентификатор и имя в VK ID;</li>
          <li>дата рождения — если вы сохранили её в портрете;</li>
          <li>версия и дата вашего согласия;</li>
          <li>технические cookie для входа и, только с вашего согласия, cookie Яндекс.Метрики.</li>
        </ul>

        <h2>3. Зачем</h2>
        <ul>
          <li>вход на сайт;</li>
          <li>хранение даты рождения и показ расчётов символических практик в вашем портрете;</li>
          <li>статистика посещений — только с согласия на cookie.</li>
        </ul>

        <h2>4. Правовое основание</h2>
        <p>Согласие на обработку персональных данных (п. 1 ч. 1 ст. 6 152-ФЗ).</p>

        <h2>5. Что с данными делают и где хранят</h2>
        <p>
          Сбор, запись, систематизация, хранение, уточнение, использование, передача получателям из раздела 6, удаление. Данные хранятся{" "}
          {DATA_STORAGE}, то есть в России.
        </p>

        <h2>6. Кому передаются</h2>
        <ul>
          {DATA_RECIPIENTS.map((recipient) => (
            <li key={recipient.name}>
              <strong>{recipient.name}</strong> — {recipient.what}. Зачем: {recipient.why}.
            </li>
          ))}
        </ul>
        <p>Другим лицам данные не передаются, кроме случаев, предусмотренных законом.</p>

        <h2>7. Сроки</h2>
        <p>Данные хранятся, пока вы не удалите их или не отзовёте согласие.</p>

        <h2>8. Ваши права</h2>
        <p>
          Вы можете узнать, какие данные о вас хранятся, попросить исправить их, удалить их или отозвать согласие. Удалить данные можно на
          странице <Link href="/portret/delete">«Удалить мои данные»</Link> или письмом на {OPERATOR.email} — письма обрабатываются в течение
          30 дней.
        </p>

        <h2>9. Cookie</h2>
        <p>
          Технические cookie нужны для входа, без них портрет не работает. Cookie Яндекс.Метрики ставятся только после кнопки «Принять» в
          баннере. Выбор можно изменить в любой момент кнопкой «Настройки cookie» внизу страницы.
        </p>

        <h2>10. Защита</h2>
        <p>
          Сайт работает только по HTTPS, доступ к серверу и базе есть только у оператора, ключи сервисов хранятся отдельно от кода. Портрет
          виден только его владельцу.
        </p>

        <p className="muted">
          Согласие на обработку данных — на странице <Link href="/consent">согласия</Link>.
        </p>
      </article>
    </main>
  );
}
```

`apps/web/src/app/consent/page.tsx`:

```tsx
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
```

`apps/web/src/app/contacts/page.tsx`:

```tsx
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
```

- [ ] **Шаг 4. Подвал.** `apps/web/src/components/Footer.tsx`:

```tsx
import Link from "next/link";
import { DISCLAIMER } from "@/lib/legal";

const LINKS = [
  { href: "/portret", label: "Мой портрет" },
  { href: "/contacts", label: "Контакты" },
  { href: "/privacy", label: "Политика обработки данных" },
  { href: "/consent", label: "Согласие" },
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <nav aria-label="Документы и разделы">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="disclaimer">{DISCLAIMER}</p>
    </footer>
  );
}
```

В `apps/web/src/app/layout.tsx` добавить импорт `import { Footer } from "@/components/Footer";` и строку `<Footer />` сразу после `{children}`.

- [ ] **Шаг 5. Проверка в браузере.** `pnpm dev:db` и `pnpm dev:web`; открыть `/privacy`, `/consent`, `/contacts`: у всех подвал с оговоркой, в исходнике страницы `<meta name="robots" content="index, follow">` и `<link rel="canonical" href="http://localhost:3000/privacy">` (для `/privacy`). `/sitemap.xml` содержит все четыре публичных адреса. На 375 px текст не вылезает за экран.

- [ ] **Шаг 6. Почта оператора.** Спросить владелицу: «Для ORACLE оставить почту lagutenkova.olga@yandex.ru или нужна другая?» При другой — заменить `OPERATOR.email`, прогнать `pnpm vitest run apps/web/src/lib/legal.test.ts`.

- [ ] **Шаг 7. Проверки и коммит.**

```bash
pnpm vitest run
pnpm typecheck
git add apps/web/src/lib apps/web/src/app/privacy apps/web/src/app/consent apps/web/src/app/contacts apps/web/src/components/Footer.tsx apps/web/src/app/layout.tsx
git commit -m "feat(web): privacy policy, consent, contacts and footer disclaimer"
```
