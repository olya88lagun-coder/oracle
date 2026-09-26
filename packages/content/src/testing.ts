type SampleArcanum = { number?: number; name?: string; slug?: string; keywords?: string; drop?: string; extra?: string; essence?: string };

// Корректный файл аркана; поля переопределяются, секцию можно выбросить (drop) или добавить лишний текст (extra)
export function sampleArcanumSource(p: SampleArcanum = {}): string {
  const sections: [string, string][] = [
    ["Суть", p.essence ?? "Первый абзац о сути.\n\nВторой абзац о сути."],
    ["В личности", "Как это видно в характере."],
    ["В центре", "На что можно опереться."],
    ["Как задача", "Какой урок стоит заметить."],
    ["В ресурсе", "- спокойствие\n- ясность\n- тепло"],
    ["В перекосе", "- спешка\n- контроль\n- обида"],
    ["Действие на сегодня", "Сделайте одно маленькое дело."],
    ["Вопрос для себя", "Что для вас сейчас важно?"],
  ];
  const body = sections
    .filter(([title]) => title !== p.drop)
    .map(([title, text]) => `## ${title}\n\n${text}`)
    .join("\n\n");
  return [
    "---",
    `number: ${p.number ?? 11}`,
    `name: ${p.name ?? "Сила"}`,
    `slug: ${p.slug ?? "sila"}`,
    `keywords: ${p.keywords ?? "мягкая сила; самообладание; доверие к себе"}`,
    "---",
    "",
    p.extra ?? "",
    body,
  ].join("\n");
}
