"""Собирает файлы шрифтов для сайта (результат уже лежит в apps/web/src/app/fonts; скрипт нужен, только чтобы пересобрать): латиница + кириллица + знаки, которые нужны тексту, в woff2.
Manrope оставляем вариативным по весу (200–800), у Noto Serif Display фиксируем ширину 100 и вес 300–400 — как грузилось с Google."""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

import sys
from pathlib import Path

# python scripts/build-fonts.py <папка с исходными шрифтами Google Fonts>
SRC = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = str(Path(__file__).resolve().parent.parent / "apps/web/src/app/fonts")
os.makedirs(OUT, exist_ok=True)

# Basic Latin, Latin-1, расширенная латиница для имён, общая пунктуация, кириллица (+ расширенная), № ₽ € ™ стрелки, минус
UNICODES = (
    list(range(0x0020, 0x007F))
    + list(range(0x00A0, 0x0180))
    + list(range(0x2000, 0x2070))
    + list(range(0x0400, 0x0530))
    + [0x2116, 0x20BD, 0x20AC, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x2215, 0x2022, 0x00B7, 0x2013, 0x2014, 0x2026, 0x2032, 0x2033]
)


def build(src_name, out_name, limits=None):
    font = TTFont(f"{SRC}/{src_name}")
    options = subset.Options()
    options.layout_features = ["*"]
    options.notdef_outline = True
    options.name_IDs = ["*"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(font)
    # Сначала подмножество знаков, потом фиксация осей: так у вариативного шрифта нет «висящих» имён глифов
    if limits:
        font = instancer.instantiateVariableFont(font, limits)
    font.flavor = "woff2"
    path = f"{OUT}/{out_name}"
    font.save(path)
    print(out_name, os.path.getsize(path), "bytes")


build("Manrope[wght].ttf", "Manrope-latin-cyrillic.woff2")
# Noto Serif Display: ширина 100, вес 300–400
build("NotoSerifDisplay[wdth,wght].ttf", "NotoSerifDisplay-latin-cyrillic.woff2", {"wdth": 100, "wght": (300, 400)})
