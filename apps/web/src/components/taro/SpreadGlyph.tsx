// Рисунок расклада: маленькие карты лежат так, как лежат позиции расклада. Декоративный, без текста
export const GLYPH_BOX = { width: 120, height: 112, card: { w: 24, h: 38 } } as const;

// Левый верхний угол каждой карты в рамке GLYPH_BOX; число карт равно числу позиций расклада
export const GLYPH_LAYOUTS: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  "tri-karty": [[8, 36], [48, 36], [88, 36]],
  otnosheniya: [[8, 6], [48, 6], [88, 6], [48, 60]],
  vybor: [[48, 0], [8, 34], [8, 74], [88, 34], [88, 74]],
  "delo-i-dengi": [[8, 70], [48, 44], [88, 18]],
  "na-segodnya": [[8, 56], [48, 22], [88, 56]],
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
