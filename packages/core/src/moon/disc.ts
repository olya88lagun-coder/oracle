// Освещённая часть диска Луны в координатах с центром (0, 0) и осью y вниз (как в SVG): растущая Луна освещена справа, убывающая слева

const round = (value: number): number => Math.round(value * 1000) / 1000;

// Ширина освещённой части вдоль экватора диска. Терминатор стоит на x = r·(1 − 2f) у растущей и x = r·(2f − 1) у убывающей Луны
export function discEquatorSpan(illumination: number, waxing: boolean, radius: number): { from: number; to: number } {
  return waxing ? { from: radius * (1 - 2 * illumination), to: radius } : { from: -radius, to: radius * (2 * illumination - 1) };
}

// Значение атрибута `d`: дуга лимба сверху вниз и обратно по терминатору — полуэллипс с горизонтальной полуосью |1 − 2f|·r.
// При освещённости 0 освещённой части нет (пустая строка)
export function discLitPath(illumination: number, waxing: boolean, radius: number): string {
  if (illumination <= 0) return "";
  const rx = round(radius * Math.abs(1 - 2 * illumination));
  const r = round(radius);
  // Растущая: лимб справа (по часовой, sweep 1). Терминатор — справа от центра при освещённости < 0,5 (против часовой) и слева при > 0,5.
  // У убывающей всё зеркально
  const limbSweep = waxing ? 1 : 0;
  const bulgesToLimbSide = illumination < 0.5;
  const terminatorSweep = waxing === bulgesToLimbSide ? 0 : 1;
  return `M 0 ${-r} A ${r} ${r} 0 0 ${limbSweep} 0 ${r} A ${rx} ${r} 0 0 ${terminatorSweep} 0 ${-r} Z`;
}
