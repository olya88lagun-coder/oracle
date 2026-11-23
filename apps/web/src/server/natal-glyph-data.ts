// Создан скриптом scripts/natal-glyph-data.mjs из components/natal/NatalSprite.tsx, не править вручную. Сетка символа 24×24, линия 1.6, закруглённые концы
export type GlyphShape = { d: string } | { cx: number; cy: number; r: number; fill: boolean };
export const GLYPH_STROKE = 1.6;
export const GLYPHS: Readonly<Record<string, readonly GlyphShape[]>> = {
  "glyph-sun": [{"cx":12,"cy":12,"r":7.3,"fill":false},{"cx":12,"cy":12,"r":1.5,"fill":true}],
  "glyph-moon": [{"d":"M16.7 3.5a9.5 9.5 0 1 0 0 17 10 10 0 0 1 0-17Z"}],
  "glyph-mercury": [{"cx":12,"cy":10,"r":4.7,"fill":false},{"d":"M7.3 3.3c0 4.7 9.4 4.7 9.4 0M12 14.7v6.6M8.5 18h7"}],
  "glyph-venus": [{"cx":12,"cy":8.5,"r":5.3,"fill":false},{"d":"M12 13.8v7.4M8.5 17.8h7"}],
  "glyph-mars": [{"cx":9,"cy":15,"r":5.5,"fill":false},{"d":"m13 11 7.2-7.2M14.7 3.8h5.5v5.5"}],
  "glyph-jupiter": [{"d":"M7 4.3c.8 4.8-.8 7.5-4 10.2h16.8M15.8 3.5v17"}],
  "glyph-saturn": [{"d":"M8 3v14.5M4.4 6.8h7.2M8 13c2.5-5.7 9-4.6 9 .2 0 3-3.5 4.7-3.5 7.4 0 1.3 1.5 1.8 3 1"}],
  "glyph-uranus": [{"d":"M5 4v10M19 4v10M5 9h14M12 4v11"},{"cx":12,"cy":18.2,"r":3.2,"fill":false}],
  "glyph-neptune": [{"d":"M5.2 4.2v3.5c0 7.5 13.6 7.5 13.6 0V4.2M12 3v18M8.3 17.5h7.4M3.4 6.2l1.8-2 1.8 2M17 6.2l1.8-2 1.8 2"}],
  "glyph-pluto": [{"cx":12,"cy":5.8,"r":2.7,"fill":false},{"d":"M5.3 6.5v1c0 7.8 13.4 7.8 13.4 0v-1M12 13.5v8M8.3 18h7.4"}],
  "glyph-node": [{"d":"M6.2 16.5C.8 11.6 5.2 4.3 12 4.3s11.2 7.3 5.8 12.2"},{"cx":6,"cy":18,"r":2.3,"fill":false},{"cx":18,"cy":18,"r":2.3,"fill":false}],
  "glyph-aries": [{"d":"M12 21V9.8C12-1 1.8 1.1 4 9.6M12 9.8C12-1 22.2 1.1 20 9.6"}],
  "glyph-taurus": [{"cx":12,"cy":14.2,"r":6.3,"fill":false},{"d":"M4.5 3c0 6.4 15 6.4 15 0"}],
  "glyph-gemini": [{"d":"M5 3.4c4.6 2.1 9.4 2.1 14 0M5 20.6c4.6-2.1 9.4-2.1 14 0M8.6 5.1v13.8M15.4 5.1v13.8"}],
  "glyph-cancer": [{"cx":7.2,"cy":8.1,"r":3.1,"fill":false},{"cx":16.8,"cy":15.9,"r":3.1,"fill":false},{"d":"M4.2 7.4C8.2 1.7 16 2.5 20 6.5M19.8 16.6C15.8 22.3 8 21.5 4 17.5"}],
  "glyph-leo": [{"cx":6.5,"cy":16.2,"r":3.1,"fill":false},{"d":"M8.5 13.8c3.4-3.5 0-5.9 1.5-9 2.4-4.8 9.1-1.7 7.1 3.3-1.5 3.6-6.4 6.8-5.1 10.2 1.1 3 5.6 2.6 8.2-.2"}],
  "glyph-virgo": [{"d":"M3 20V7c0-4.5 5-4.5 5 0v13M8 7c0-4.5 5-4.5 5 0v13M13 7c0-4.5 5-4.5 5 0v10c0 2.9-2.3 4.4-5 4.4M18 9.5c-5.8 0-5.8 8 3.2 10.3"}],
  "glyph-libra": [{"d":"M3 15h5a5.4 5.4 0 1 1 8 0h5M3 20h18"}],
  "glyph-scorpio": [{"d":"M3 20V7c0-4.5 5-4.5 5 0v13M8 7c0-4.5 5-4.5 5 0v13M13 7c0-4.5 5-4.5 5 0v9c0 2 1.5 3 4 3M19.8 16.7 22 19l-2.2 2.3"}],
  "glyph-sagittarius": [{"d":"M4 20 20 4M12.8 4H20v7.2M5 11.5l7.5 7.5"}],
  "glyph-capricorn": [{"d":"M3 6.5c3.8-3.3 6.3-.2 6.3 4.2V18M9.3 10.7c2.3-6.8 7.5-7.7 7.1-3-.5 5.4-6.7 14.7-1.5 14.7 3.7 0 6-3.2 5.3-6.5-.6-2.8-4.3-3.4-6.8-.6"}],
  "glyph-aquarius": [{"d":"m3 8 3.6-3 3.6 3 3.6-3 3.6 3L21 5M3 18l3.6-3 3.6 3 3.6-3 3.6 3 3.6-3"}],
  "glyph-pisces": [{"d":"M5 3c5.8 5.2 5.8 12.8 0 18M19 3c-5.8 5.2-5.8 12.8 0 18M4 12h16"}],
  "glyph-retro": [{"d":"M5 21V3h6c7 0 7 9 0 9H5M11 12l9 9M13.3 20.7l6.6-6.6"}],
};
