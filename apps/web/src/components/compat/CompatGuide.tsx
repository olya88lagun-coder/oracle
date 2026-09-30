export const COMPAT_FAQ: readonly { question: string; answer: string }[] = [
  {
    question: "Нужна ли регистрация?",
    answer: "Нет. Расчёт делается в браузере. Если вы вошли через VK ID, ваша дата подставится из портрета.",
  },
  {
    question: "Сохраняются ли даты?",
    answer:
      "Нет. Даты остаются на вашем устройстве. Единственный случай, когда они отправляются на сервер, — кнопка «Скачать PDF»: сервер собирает файл и сразу забывает даты. В самом файле дат нет, только арканы.",
  },
  {
    question: "Это предсказание, подойдёте ли вы друг другу?",
    answer:
      "Нет. Мы не предсказываем судьбу отношений и не оцениваем, «подходите» ли вы друг другу. Результат — повод поговорить о сильных сторонах и о том, к чему стоит присмотреться.",
  },
  {
    question: "Можно ли проверить пару, если вы давно вместе или расстались?",
    answer: "Можно. Матрица зависит только от дат рождения, а не от статуса отношений.",
  },
];

export const COMPAT_CALC_ID = "raschet";
export const COMPAT_METHOD_ID = "kak-schitaetsya";

export function compatFaqJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ru",
    mainEntity: COMPAT_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

const PREVIEW: readonly { title: string; text: string; accent?: boolean }[] = [
  { title: "Аркан вашей пары", text: "Один общий образ: что между вами легче всего загорается и где нужна бережность." },
  { title: "Вы и партнёр", text: "Ключевые точки каждой матрицы рядом: личность, центр и задача без сравнения «лучше / хуже».", accent: true },
  { title: "Сходства и различия", text: "Короткая сводка о том, где вы похожи, а где смотрите на ситуацию разными способами." },
];

const STEPS: readonly { title: string; text: string }[] = [
  { title: "Сначала две матрицы", text: "Для каждого из вас считается матрица судьбы по дате рождения." },
  { title: "Потом общий аркан", text: "Центры двух матриц складываются, и сумма приводится к номеру аркана от 1 до 22." },
  { title: "Затем сопоставление", text: "Мы смотрим личность, центр и задачу каждого: где арканы совпадают и где различаются." },
];

// Что покажет результат: три блока, которые появятся после расчёта
export function CompatPreview() {
  return (
    <section className="stack compat-section" aria-labelledby="compat-preview">
      <p className="eyebrow eyebrow--line">Что покажет результат</p>
      <h2 id="compat-preview">Не вердикт, а карта разговора</h2>
      <ol className="compat-cards">
        {PREVIEW.map((item, index) => (
          <li key={item.title} className={item.accent ? "card card--accent compat-card" : "card compat-card"}>
            <span className="compat-card__index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3>{item.title}</h3>
            <p className="muted">{item.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Пояснения под калькулятором: как считается совместимость и частые вопросы (те же тексты уходят в разметку FAQPage)
export function CompatGuide() {
  return (
    <>
      <section className="stack compat-section" id={COMPAT_METHOD_ID} aria-labelledby="compat-how">
        <p className="eyebrow eyebrow--line">Метод</p>
        <h2 id="compat-how">Как считается совместимость</h2>
        <ol className="compat-cards">
          {STEPS.map((step) => (
            <li key={step.title} className="card compat-card">
              <h3>{step.title}</h3>
              <p className="muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="compat-note">Это символический способ поговорить об отношениях, а не оценка и не прогноз.</p>
      </section>

      <section className="stack compat-section" aria-labelledby="compat-faq">
        <p className="eyebrow eyebrow--line">Вопросы</p>
        <h2 id="compat-faq">Частые вопросы</h2>
        <div className="compat-faq">
          {COMPAT_FAQ.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

// Финальный призыв: ссылки, а не кнопки, чтобы главная кнопка расчёта на странице оставалась одной
export function CompatCta() {
  return (
    <section className="card card--accent compat-cta" aria-labelledby="compat-cta">
      <div className="stack">
        <h2 id="compat-cta">Готовы посмотреть общий аркан?</h2>
        <p className="muted">Введите две даты и используйте результат как спокойную подсказку для разговора.</p>
      </div>
      <div className="row compat-cta__actions">
        <a className="button button--lavender" href={`#${COMPAT_CALC_ID}`}>
          К расчёту
        </a>
        <a className="button button--ghost" href={`#${COMPAT_METHOD_ID}`}>
          Как считается
        </a>
      </div>
    </section>
  );
}
