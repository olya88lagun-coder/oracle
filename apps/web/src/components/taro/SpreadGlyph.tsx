// Рисунок расклада: маленькие карты лежат так, как лежат позиции расклада. Декоративный, без текста
export const GLYPH_BOX = { width: 120, height: 112, card: { w: 24, h: 38 } } as const;

// Левый верхний угол каждой карты в рамке GLYPH_BOX; число карт равно числу позиций расклада
export const GLYPH_LAYOUTS: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  "tri-karty": [[8, 36], [48, 36], [88, 36]],
  otnosheniya: [[8, 6], [48, 6], [88, 6], [48, 60]],
  vybor: [[8, 8], [8, 62], [88, 8], [88, 62], [48, 62]],
  "delo-i-dengi": [[8, 70], [48, 44], [88, 18]],
  "na-segodnya": [[8, 56], [48, 22], [88, 56]],
  // Три карты итогов сверху, две карты на новый год ниже и по центру
  "novyy-god": [[8, 8], [48, 8], [88, 8], [28, 62], [68, 62]],
  // Четыре карты в ряд-ромб: центр сверху, тени и опора по бокам, шаг снизу
  samopoznanie: [[48, 4], [8, 38], [88, 38], [48, 70]],
  konflikt: [[8, 36], [88, 36], [48, 8], [48, 66]],
  "smena-raboty": [[8, 8], [48, 8], [88, 8], [28, 62], [68, 62]],
  roditeli: [[8, 6], [48, 6], [88, 6], [48, 60]],
  novolunie: [[8, 36], [38, 18], [68, 18], [96, 36]],
  polnolunie: [[48, 4], [8, 42], [88, 42], [48, 72]],
};

export function SpreadGlyph({ slug }: { slug: string }) {
  const layout = GLYPH_LAYOUTS[slug] ?? [];
  const { w, h } = GLYPH_BOX.card;
  return (
    <svg className="taro-glyph" viewBox={`0 0 ${GLYPH_BOX.width} ${GLYPH_BOX.height}`} aria-hidden="true" focusable="false">
      {layout.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={w} height={h} rx={3} />
          <path d={`M${x + w / 2} ${y + h / 2 - 9} l4.5 9 -4.5 9 -4.5 -9z`} />
        </g>
      ))}
    </svg>
  );
}
