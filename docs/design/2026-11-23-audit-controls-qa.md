# Audit controls — visual completion, 23 November 2026

Presentation-only follow-up to PR #318. That PR supplies the compatibility contexts and clock lookup logic. The natal uncertainty state and Lila rules passport already exist on master. No article teaching figures from #315 are changed.

| Before | After | Reason |
|---|---|---|
| Context choices reused natal styles; on a phone three buttons shared one row and the fourth occupied another | Four equal choices, two columns on phones, stable border widths, bronze selected state plus a checkmark and visible keyboard focus | The same control reads consistently under both compatibility results and does not shift when selected |
| Clock lookup appeared as a loose field, button and text | Bounded panel aligned with the article introduction; large tabular digits; full-width phone action; a clear result link or neutral ordinary-time response | Keeps input, action and response together without changing lookup behaviour |
| The uncertain Moon card had two long inline links; its noon degree could wrap into a narrow mobile cell | Two equally presented alternatives with clear action/position lines; the degree cell spans the mobile row; uncertainty highlighting covers the complete row | Preserves both possibilities and makes the noon qualification readable |
| Lila rules used the generic blog table on all screens | A framed two-column desktop table; full-width label/description rows on phones | Avoids narrow columns and sideways scrolling while retaining native table structure |

## Scope

- Shared token-based styles in `apps/web/src/app/audit-controls.css`, imported after the previous audit stylesheet.
- Presentation hooks/wrappers only in CompatContext, ClockLookup, NatalKeys, NatalTable and HowToPlayLila. Clock errors are associated with their input through `aria-describedby`.
- Existing calculations, validation, texts, links, state, storage and network behaviour remain. Existing compatibility button classes and pressed semantics remain so the public contract tests still apply.
- No changes to library, core, AI, server, legal, generated content or deployment files relative to PR #318.

## Browser verification

Browser viewport checks, not physical-device testing. Screenshots were inspected inline; no saved screenshot artifact is claimed.

- `/sovmestimost`: fictional dates 07.03.1990 and 29.03.1988; four controls at 390 and 320 px. Colleagues changed its note; Relatives activated with Enter. Buttons were 52 px high and equal width. No document overflow at 320 px.
- `/numerologiya/kvadrat-pifagora/sovmestimost`: fictional dates 14.05.1987 and 07.03.1976; Friends selected at 1440 and 390 px. All five questions shown. Four equal desktop columns, two phone columns; no document overflow at 390 px.
- `/numerologiya/chasy`: 320, 768, 1024 and 1440 px. `1111` found 11:11; `12:21` found its page; Enter submitted ordinary 14:37; 99:99 showed the existing validation message. The error's id matches the input description. Found/ordinary/error states were visually inspected. No document overflow at 320 px.
- `/natalnaya-karta`: Moscow, 07.03.1990, unknown birth time. Actual calculation produced Cancer/Leo alternatives. Both links remain; mobile degree row reads “на полдень” together with the computed degree. Inspected at 320 and 1440 px. Existing known-time results are covered by the component contract tests.
- `/blog/kak-igrat-v-lilu-onlain`: inspected at 320, 390 and 1440 px. Five row headers and five cells remain exposed in the accessibility tree. Mobile labels take the full inner width. No document overflow at 320 px.
- No captured browser console errors in the checked tab; temporary viewport override reset.

## Validation

Local typecheck and targeted tests are recorded in the PR description. Full CI coverage must pass before owner acceptance. Physical phones, payments and production publication are outside this visual package.

PR #318 has merged. This visual follow-up now targets master and includes the updated base through PR #317. Owner handles merge and publication.
