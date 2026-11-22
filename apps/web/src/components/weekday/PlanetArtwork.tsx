import Image from "next/image";
import type { PlanetGlyph } from "@/lib/weekday-planets";

const WIDTHS = { mini: 160, card: 384, hero: 768 } as const;

// Подпись планеты уже есть рядом. Все три размера хранятся на нашем домене.
export function PlanetArtwork({ glyph, size = "mini", eager = false }: {
  glyph: PlanetGlyph;
  size?: keyof typeof WIDTHS;
  eager?: boolean;
}) {
  const width = WIDTHS[size];
  return <Image className="planet-artwork" src={`/images/weekday/${glyph}-${width}.webp`} alt="" width={width} height={width} unoptimized loading={eager ? "eager" : "lazy"} />;
}
