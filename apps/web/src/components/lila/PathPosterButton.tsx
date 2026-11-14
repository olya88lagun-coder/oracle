"use client";

import { PosterButton } from "@/components/PosterButton";
import { LILA_CELL_COUNT } from "@oracle/core";
import { BOARD_CANVAS, cellCenter, isLilaCellNumber } from "./board-data";

// «Мой путь»: золотая нить по пройденным клеткам для сторис. Намерение и записи на картинку не попадают
export function PathPosterButton({ trail, moves, opened }: { trail: readonly number[]; moves: number; opened: number }) {
  return (
    <PosterButton
      label="Картинка «Мой путь»"
      spec={{
        trail: trail.filter(isLilaCellNumber).map(cellCenter),
        board: { image: "/lila/board-base.webp", width: BOARD_CANVAS.width, height: BOARD_CANVAS.height },
        moves,
        opened,
        total: LILA_CELL_COUNT,
        footer: "ТВОЙ ОРАКУЛ · TVOY-ORAKUL.RU",
        fileName: "moy-put-lila",
      }}
    />
  );
}
