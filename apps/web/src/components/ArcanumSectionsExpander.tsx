"use client";

import { useEffect } from "react";

// Ширина, с которой страница аркана показывается развёрнутой; совпадает с @media в globals.css
const DESKTOP_QUERY = "(min-width: 760px)";

// На компьютере все секции открыты и не сворачиваются: data-static убирает значок и клики по заголовку
export function ArcanumSectionsExpander() {
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const apply = () => {
      for (const section of document.querySelectorAll<HTMLDetailsElement>("details.arcanum-section")) {
        const summary = section.querySelector("summary");
        if (media.matches) {
          section.open = true;
          section.dataset.static = "";
          summary?.setAttribute("tabindex", "-1");
        } else {
          delete section.dataset.static;
          summary?.removeAttribute("tabindex");
        }
      }
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return null;
}
