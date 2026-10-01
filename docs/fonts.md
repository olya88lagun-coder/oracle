# Шрифты

Сайт отдаёт шрифты со своего домена, сборка не обращается к fonts.google.com (раньше `next/font/google` скачивал их при сборке, и одна выкладка упала из-за сбоя сети).

| Файл | Что это | Вес |
|---|---|---|
| `apps/web/src/app/fonts/Manrope-latin-cyrillic.woff2` | Manrope, основной текст | вариативный 200–800 |
| `apps/web/src/app/fonts/NotoSerifDisplay-latin-cyrillic.woff2` | Noto Serif Display, заголовки | 300–400, ширина 100 |

Лицензия обоих — SIL OFL 1.1, тексты лежат рядом (`OFL-*.txt`). Подключены в `apps/web/src/app/layout.tsx` через `next/font/local`; CSS-переменные `--font-manrope` и `--font-noto-display` те же, что были.

Подмножество: латиница, кириллица, общая пунктуация, `№`, `₽`, `€`, стрелки. Стрелки `→` в Noto Serif Display нет — браузер берёт запасной шрифт, как и раньше.

## Пересобрать

Исходники — вариативные TTF из репозитория google/fonts (`ofl/manrope/Manrope[wght].ttf`, `ofl/notoserifdisplay/NotoSerifDisplay[wdth,wght].ttf`), положить в одну папку:

```bash
pip install fonttools brotli
python scripts/build-fonts.py <папка с TTF>
```
