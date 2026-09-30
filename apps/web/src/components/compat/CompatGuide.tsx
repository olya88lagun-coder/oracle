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

export function compatFaqJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ru",
    mainEntity: COMPAT_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

// Пояснения под калькулятором: как считается совместимость и частые вопросы (те же тексты уходят в разметку FAQPage)
export function CompatGuide() {
  return (
    <div className="stack matrix-guide">
      <section className="stack" aria-labelledby="compat-how">
        <h2 id="compat-how">Как считается совместимость</h2>
        <p>
          Для каждого из вас считается матрица судьбы по дате рождения. Центры двух матриц складываются, и сумма приводится к номеру аркана от 1 до
          22 — это аркан вашей пары. Дополнительно мы сопоставляем личность, центр и задачу каждого из вас: где арканы совпадают и где различаются.
        </p>
        <p>Это символический способ поговорить об отношениях, а не оценка и не прогноз.</p>
      </section>

      <section className="stack" aria-labelledby="compat-faq">
        <h2 id="compat-faq">Частые вопросы</h2>
        {COMPAT_FAQ.map((item) => (
          <div key={item.question} className="stack matrix-guide__item">
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
