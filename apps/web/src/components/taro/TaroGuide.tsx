import { TARO_AUTHOR_CREDIT } from "@/lib/taro-paths";

export const TARO_FAQ: readonly { question: string; answer: string }[] = [
  {
    question: "Что такое карта дня?",
    answer: "Это одна карта из колоды Таро на сегодня. Она не предсказывает события, а даёт образ и вопрос, с которыми удобно посмотреть на свой день.",
  },
  {
    question: "Сохраняется ли выбор карты?",
    answer: "Карта выбирается в вашем браузере и запоминается только на вашем устройстве до полуночи по московскому времени. Мы не храним вашу карту на сервере.",
  },
  {
    question: "Это предсказание?",
    answer: "Нет. Мы не предсказываем будущее и не даём советов о здоровье, деньгах или отношениях. Карта — символ, повод задать себе вопрос и заметить то, что обычно ускользает.",
  },
  {
    question: "Чья это колода?",
    answer: `Мы используем классическую колоду Райдер–Уэйт. ${TARO_AUTHOR_CREDIT}.`,
  },
];

export function taroFaqJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ru",
    mainEntity: TARO_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

export function TaroGuide() {
  return (
    <section className="stack matrix-guide" aria-labelledby="taro-faq">
      <h2 id="taro-faq">Частые вопросы</h2>
      {TARO_FAQ.map((item) => (
        <div key={item.question} className="stack matrix-guide__item">
          <h3>{item.question}</h3>
          <p>{item.answer}</p>
        </div>
      ))}
    </section>
  );
}
