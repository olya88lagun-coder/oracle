# Visual audit implementation — 23 November 2026

## Implemented

Presentation-only changes. The original artwork, typography and dark bronze palette remain.

- Seven Matrix teaching figures use `calculateMatrix` and existing diagram coordinates. Point letters and arcana values are separated; focused positions have a textual legend. Diagrams retain a readable minimum width inside their own keyboard-accessible scroll region.
- Tarot suit and court articles show four aces and all sixteen court cards. All images retain their aspect ratios and link to the relevant meaning. Existing author credit is displayed.
- The natal houses article uses the existing chart engine and wheel for a fictional Moscow example. Both this example and the calculator wheel can be enlarged.
- Matrix full readings occupy the result width below the diagram/focus grid.
- Lunar mobile controls and tabs use separate rows. Single-day lunar text and facts use a desktop grid, then stack on small screens.
- Portrait artwork is contained in blog previews/covers. Wide scene assets retain their existing cropping.
- Tarot usage links and the Matrix report's additional book presentation are native disclosures; source text and links remain.
- The current Lila cell uses the existing image enlargement component with the full original image.

## Browser evidence

Tested locally with a browser viewport override; this is not a real-device test. Widths: 320, 390, 768, 1024, 1440 px. Selected screenshot observations were displayed in the chat. Screenshot export to a separate file was unavailable; no saved screenshot artifact is claimed.

- At 1440 px the Matrix result renders three approximately 416 px cards; the focus controls still select Center and Task. At 390 px the cards stack and the document does not overflow.
- The full Matrix teaching diagram renders distinct inner-point labels. A hydration warning caused by a multi-child SVG title was fixed; subsequent visits produced no new hydration error.
- At 320 px lunar controls occupy the upper row and tabs remain horizontally scrollable within the rail. At 768 px the summary, city and streak fit above the tabs. Document width stays within the viewport.
- At 1440 px lunar day 12 renders a roughly 652/444 px text/facts grid.
- At 1024 px the court comparison uses four columns and all 16 images have loaded; on mobile it uses two columns.
- Natal enlargement opens, closes on Escape and returns focus to its button. The enlarged wheel scrolls within the dialog.
- A local guest Lila test game reaches cell 1 using the existing own-die control. The full cell image opens, closes on Escape and restores focus.
- Tarot disclosure opens with Enter and retains seven links in the checked section. The report book opens through its summary; ordinary reading remains available below it.

## Checks and limitations

- Workspace typecheck passed after rebasing on master through PR #313.
- 43 targeted tests passed in six files, including seven new tests verifying example numbers, card completeness/links and the house/sign distinction.
- Initial broad local test runs experienced resource/time failures and were stopped. The full CI coverage run must be checked before acceptance.
- Final shared Matrix figure width rules were reviewed against the already checked full diagram; each of the seven focused variants was not individually re-captured after that last shared CSS adjustment.
- Real devices, authenticated account flows, real payments and production deployment were not tested by this visual package.
- Decorative compression of Thread/day-card/weekday pages remains a possible follow-up, not a confirmed defect fixed by this change. Geometry of dense natal labels remains unchanged.

Owner handles merge/publication.
