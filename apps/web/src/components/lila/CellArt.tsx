import Image from "next/image";
import { lilaCellImage, lilaImageFile, type LilaImageSize } from "@/lib/lila-paths";
import { CellFallback } from "./CellFallback";

type Props = { cell: { number: number; slug: string; name: string }; size?: LilaImageSize; available: readonly string[]; priority?: boolean; decorative?: boolean };
const PIXELS = { page: 960, card: 480, thumb: 160 } as const;

export function CellArt({ cell, size = "card", available, priority, decorative = false }: Props) {
  if (!available.includes(lilaImageFile(cell, size))) return <CellFallback number={cell.number} size={size} decorative={decorative} />;
  return (
    <Image className={`lila-art lila-art--${size}`} src={lilaCellImage(cell, size)} alt={decorative ? "" : `Клетка ${cell.number} «${cell.name}»`} width={PIXELS[size]} height={PIXELS[size]} priority={priority} unoptimized />
  );
}
