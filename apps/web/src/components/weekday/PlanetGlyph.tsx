import type { PlanetGlyph as GlyphId } from "@/lib/weekday-planets";

// Знаки планет линиями (не символами Unicode: те на разных устройствах превращаются в цветные эмодзи). Холст 24×24, цвет берётся из currentColor
export const GLYPH_PATHS: Record<GlyphId, readonly string[]> = {
  moon: ["M18 4A9 9 0 1 0 18 20 8.2 8.2 0 0 1 18 4z"],
  mars: ["M10 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12z", "M14.2 9.8 20 4", "M15 4h5v5"],
  mercury: ["M12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M8 3a4 4 0 0 0 8 0", "M12 17v5", "M9.5 20h5"],
  jupiter: ["M6 5c4-2 8 0 8 4 0 3-3 5-8 7h13", "M16.5 4v17"],
  venus: ["M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10z", "M12 13v8", "M8.5 17.5h7"],
  saturn: ["M5 6h6", "M8 3v6c2-2 8-2 8 3 0 4-4 4-4 8"],
  sun: ["M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z", "M12 10.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"],
};

export function PlanetGlyph({ glyph, size = 24, className }: { glyph: GlyphId; size?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {GLYPH_PATHS[glyph].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
