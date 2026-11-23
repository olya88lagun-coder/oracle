# Tarot variants and summary — visual follow-up

23 November 2026. Follow-up to PR #321. Presentation uses existing bronze tokens and the original spread layout/card art.

| Before | After | Reason |
|---|---|---|
| Choice variants used two plain fields | A paired grid on wide screens, stacked on phones | Keeps A/B comparable and labels readable |
| User variant names ran into positional text and uppercase eyebrows | Separate sentence-case lines with safe wrapping | Long names remain readable without changing card button names |
| The summary reused generic panel/input styles | One framed reflection area, three full-width textareas and a clear copy action | Provides useful writing space and a visible next action |
| Temporary lifetime was only implicit in the privacy wording | A short note states that refresh clears the summary; textareas refer to it | Prevents confusing page state with saved portrait entries |
| Copy success remained after changing the copied data | Question, variant and summary edits clear the previous copy status | The confirmation describes the actual copy attempt |

## Scope

Styles are imported by the spread route. No changes to library formatting, random selection, storage, analytics, server or card assets. The copy-status reset is local UI state only. Original field labels, headings, copy messages, card button accessible names and new-spread behaviour remain.

## Observed browser checks

- `/taro/rasklady/vybor`: fictional question and two fictional options. All five original `Позиция N: …` button names remain after entering option labels. Summary is absent after one card and appears after all five; focus moves to the reading heading.
- Actual copy succeeded. The copied text contains the spread title, question, both options, all five displayed card names and all three notes.
- Before the fix, editing a note retained “Итог скопирован.” After the fix, separate edits of a note, question and option each cleared that status. Fresh copying still succeeds.
- An 80-character unbroken option name wraps; a 400-character note scrolls inside its textarea. Document width stayed within a 320 px viewport.
- Reload clears question, options and cards, and removes the summary. Copying an empty summary omits its empty parts and the empty question.
- `/taro/rasklady/tri-karty`: no option inputs; all three summary fields appear after completion. Copying only the final step includes that step and omits the two empty notes.
- Viewports 320, 390, 768, 1024 and 1440 px across these screens. Keyboard Tab from the last note reaches the copy button. No captured console errors. Temporary viewport override reset after final checks.

These are browser viewport checks, not physical-device testing. Clipboard-denial handling was not reproduced; its existing message is retained and styled. No automated e2e run is claimed. No saved screenshot artifact is claimed; screenshots were inspected inline.

Local typecheck and targeted tests are recorded in the PR. Required full CI must pass before owner acceptance. Owner handles merge/publication.
