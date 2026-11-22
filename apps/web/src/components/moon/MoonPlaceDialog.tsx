"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PLACE_CLOSE, PLACE_DIALOG_TITLE, PLACE_HINT, PLACE_LABEL, PLACE_LIST_LABEL, PLACE_PLACEHOLDER, PLACE_RESET, PLACE_ZONE_ERROR } from "@/lib/moon-place-copy";
import { placeChoice, type MoonPlace } from "@/lib/moon-place";
import { setPlace } from "@/lib/moon-place-store";
import { CityField } from "../natal/CityField";

// Окно выбора города для лунных страниц: нативный <dialog> (фокус внутри окна, Escape закрывает), поле города из натальной карты
// с лунными текстами и кнопка «Вернуться к Москве». Выбор хранится только в браузере; на сервер уходит лишь поиск города
export function MoonPlaceDialog({ open, onClose, current }: { open: boolean; onClose: () => void; current: MoonPlace | null }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setText("");
      setError(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="moon-place" aria-labelledby={titleId} onClose={onClose}>
      <h2 id={titleId} className="moon-place__title">{PLACE_DIALOG_TITLE}</h2>
      <CityField
        copy={{ label: PLACE_LABEL, placeholder: PLACE_PLACEHOLDER, hint: PLACE_HINT, listLabel: PLACE_LIST_LABEL }}
        value={text}
        selected={null}
        error={error}
        onTextChange={(value) => {
          setText(value);
          setError(null);
        }}
        onSelect={(city) => {
          const choice = placeChoice(city);
          if (choice.kind === "invalid") {
            setError(PLACE_ZONE_ERROR);
            return;
          }
          setPlace(choice.kind === "place" ? choice.place : null);
          onClose();
        }}
      />
      <div className="moon-place__actions">
        {current && (
          <button type="button" className="button button--ghost" onClick={() => { setPlace(null); onClose(); }}>{PLACE_RESET}</button>
        )}
        <button type="button" className="button button--ghost" onClick={onClose}>{PLACE_CLOSE}</button>
      </div>
    </dialog>
  );
}
