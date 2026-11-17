// Глиф из страничного спрайта (NatalSprite): знак, тело или значок «обратное движение». Декоративный — смысл всегда есть в соседнем тексте
export function NatalGlyph({ id, variant, className: extra }: { id: string; variant?: "table" | "retro"; className?: string }) {
  const base = variant ? `natal-glyph natal-glyph--${variant}` : "natal-glyph";
  const className = extra ? `${base} ${extra}` : base;
  return (
    <svg className={className} aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <use href={`#glyph-${id}`} />
    </svg>
  );
}

// Идентификатор глифа тела: у лунного узла в карте northNode, в спрайте — node
export const bodyGlyphId = (id: string): string => (id === "northNode" ? "node" : id);
