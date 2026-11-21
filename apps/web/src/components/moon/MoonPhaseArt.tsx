import Image from "next/image";
import type { PhaseId } from "@oracle/core/moon/visual";
import { phaseImage } from "@/lib/moon-images";
import { MoonDisc } from "./MoonDisc";

// Гравюра фазы в ячейке календаря вместо кружка. Гравюр восемь, поэтому соседние дни одной фазы выглядят одинаково; точная освещённость остаётся в подписи кнопки и в большой Луне сцены.
// Для фазы без картинки рисуется прежний маленький диск
export function MoonPhaseArt({ phase, illumination, waxing }: { phase: PhaseId; illumination: number; waxing: boolean }) {
  const src = phaseImage(phase, 160);
  if (!src) return <MoonDisc size="mini" illumination={illumination} waxing={waxing} phase={phase} animateIntro={false} />;
  return (
    <span className="moon-month__art" aria-hidden="true">
      <Image src={src} alt="" width={160} height={160} unoptimized loading="lazy" sizes="44px" />
    </span>
  );
}
