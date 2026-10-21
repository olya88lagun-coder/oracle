import { LILA_SESSION_PRICE_KOPECKS } from "@oracle/core";
import Link from "next/link";
import { BLOG_PATH } from "@/lib/blog";
import { formatRubles } from "@/lib/legal";

type FaqItem = { question: string; answer: string };

// Вопросы о проводнике показываем только когда платная партия включена: страница не обещает того, чего на сайте нет
export function lilaFaq(guided: boolean): readonly FaqItem[] {
  const common: FaqItem[] = [
    {
      question: "Что такое игра Лила?",
      answer:
        "Игра самопознания на поле из 72 клеток. Вы формулируете намерение, бросаете кубик и проходите путь: у каждой клетки есть тема, вопрос для размышления и, если хотите, ваша запись. Это способ посмотреть на свой вопрос по-новому, а не предсказание.",
    },
    {
      question: "Можно ли играть в Лилу онлайн бесплатно и без регистрации?",
      answer:
        "Да. Игра без проводника бесплатна и не требует регистрации. Гостевая партия хранится в вашем браузере, а через VK ID её можно сохранить в «Моём портрете».",
    },
    {
      question: "Как начать игру?",
      answer: "Чтобы начать, нужна шестёрка на кубике. Пока она не выпала, фишка стоит за полем. Затем вы идёте по клеткам и на каждой читаете короткий текст и вопрос.",
    },
    {
      question: "Что такое змеи и стрелы?",
      answer:
        "Стрелы поднимают фишку на другую клетку, змеи возвращают к теме, которая просит внимания. Полный список переходов — в статье «Змеи и стрелы Лилы».",
    },
    {
      question: "Как заканчивается игра?",
      answer: "Цель пути — клетка 68. Попасть на неё можно только точным броском, поэтому иногда стоит подождать нужного числа.",
    },
    {
      question: "Это гадание или предсказание?",
      answer:
        "Нет. Клетки не говорят, что произойдёт. Они задают вопросы для размышления, а итогом становятся ваши собственные наблюдения. Лила не заменяет консультацию психолога или врача.",
    },
    {
      question: "Как сформулировать намерение?",
      answer:
        "Выберите один личный вопрос, к которому вы готовы возвращаться: например, о решении, отношениях или усталости. Примеры формулировок разобраны в статье «Как сформулировать намерение для Лилы».",
    },
  ];
  if (!guided) return common;
  return [
    ...common,
    {
      question: "Кто такой проводник и что он делает?",
      answer: `Проводник — ИИ в платной партии за ${formatRubles(LILA_SESSION_PRICE_KOPECKS)}. Кубик и правила поля остаются прежними. Проводник связывает ходы с вашим намерением, а после завершения партии собирает итог из четырёх глав и PDF. Он предлагает гипотезы для размышления и не предсказывает исход вашего вопроса.`,
    },
    {
      question: "Какие данные получает ИИ в режиме с проводником?",
      answer:
        "Для подготовки текста GigaChat получает ваше намерение, записи мыслей, названия и описания клеток. Имя, дата рождения, e-mail и контакты не передаются. В бесплатной партии ИИ не участвует: она хранится в вашем браузере, пока вы сами не сохраните её в портрете.",
    },
  ];
}

export function lilaFaqJsonLd(guided: boolean): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ru",
    mainEntity: lilaFaq(guided).map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

export function LilaFaq({ guided }: { guided: boolean }) {
  return (
    <section className="card stack" aria-labelledby="lila-faq">
      <h2 id="lila-faq">Частые вопросы об игре Лила</h2>
      <div className="compat-faq">
        {lilaFaq(guided).map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
      <p className="muted">
        Подробнее: <Link className="text-link" href={`${BLOG_PATH}/kak-igrat-v-lilu-onlain`}>как играть в Лилу онлайн</Link>,{" "}
        <Link className="text-link" href={`${BLOG_PATH}/kak-sformulirovat-namerenie-dlya-lily`}>как сформулировать намерение</Link>,{" "}
        <Link className="text-link" href={`${BLOG_PATH}/zmei-i-strely-lily`}>змеи и стрелы</Link>
        {guided && (
          <>
            {", "}
            <Link className="text-link" href={`${BLOG_PATH}/lila-s-ii-provodnikom`}>Лила с ИИ-проводником</Link>
          </>
        )}
        .
      </p>
    </section>
  );
}
