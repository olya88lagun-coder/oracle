import Link from "next/link";
import { acceptedPairPaths } from "@/lib/numerology-pages";

// Ссылка на совместимость по квадрату: только когда партия 8 принята
export function SquarePairLink({ className = "touch-link numerology-pair-link" }: { className?: string }) {
  const [href] = acceptedPairPaths();
  return href ? <Link className={className} href={href}>Сравнить с квадратом партнёра</Link> : null;
}
