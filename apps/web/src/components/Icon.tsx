import type { SVGProps } from "react";

// Небольшой набор линейных иконок (контуры в духе Lucide): без внешних шрифтов и скриптов, цвет берётся из currentColor
const DOTS: Record<number, readonly string[]> = {
  1: ["M12 12h.01"],
  2: ["M15 9h.01", "M9 15h.01"],
  3: ["M16 8h.01", "M12 12h.01", "M8 16h.01"],
  4: ["M16 8h.01", "M8 8h.01", "M8 16h.01", "M16 16h.01"],
  5: ["M16 8h.01", "M8 8h.01", "M8 16h.01", "M16 16h.01", "M12 12h.01"],
  6: ["M16 8h.01", "M16 12h.01", "M16 16h.01", "M8 8h.01", "M8 12h.01", "M8 16h.01"],
};

const PATHS = {
  "arrow-up-right": ["M7 7h10v10", "M7 17 17 7"],
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  check: ["M20 6 9 17l-5-5"],
  "log-out": ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  "log-in": ["M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", "m10 17 5-5-5-5", "M15 12H3"],
  "trash-2": ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", "M10 11v6", "M14 11v6"],
  "circle-play": ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "m10 8 6 4-6 4z"],
  save: ["M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", "M7 3v4a1 1 0 0 0 1 1h7"],
  "maximize-2": ["M15 3h6v6", "M9 21H3v-6", "m21 3-7 7", "m3 21 7-7"],
  "chevron-down": ["m6 9 6 6 6-6"],
  "message-circle": ["M7.9 20A9 9 0 1 0 4 16.1L2 22z"],
  "grid-3x3": ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M3 9h18", "M3 15h18", "M9 3v18", "M15 3v18"],
  list: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"],
  plus: ["M5 12h14", "M12 5v14"],
  x: ["M18 6 6 18", "m6 6 12 12"],
} as const;

type Name = keyof typeof PATHS | "dice-1" | "dice-2" | "dice-3" | "dice-4" | "dice-5" | "dice-6" | "dice-empty";
type Props = { name: Name; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">;

const DIE_FRAME = "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z";

export function Icon({ name, size = 16, ...rest }: Props) {
  const die = name.startsWith("dice-") ? Number(name.slice(5)) : null;
  const paths = die !== null ? [DIE_FRAME, ...(DOTS[die] ?? [])] : PATHS[name as keyof typeof PATHS];
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={die !== null ? 1.4 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
