# Audit visual fixes implementation plan

Goal: fix confirmed visual issues from the 22 November audit while retaining existing calculations, Russian copy contracts, original artwork, and purchase flows.

Architecture: presentation-only changes in web components and CSS. Teaching figures consume existing public core/content data. No changes in lib, packages, server, APIs, legal pages, deployment or e2e tests. Work on style/audit-visual-fixes from origin/master, independently of PR #306.

1. Fix moon rail explicit mobile grid and single-day reading layout. Verify at 320, 390, 768, 1024, 1440; all tabs and city control remain reachable without overlap.
2. Move matrix key cards outside the side column. Fold Tarot usage lists and optional book without removing source text or anchors. Preserve all required button/heading contracts.
3. Correct portrait art cropping in blog cards and article cover. Keep existing wide scene images in cover mode.
4. Add static teaching figures to matching articles: labelled matrix points computed with calculateMatrix, original aces/courts, natal house example. Tests check correct example values, deck completeness and links; mobile reading verified visually.
5. Add accessible image/wheel enlargement using existing dialog patterns, without editing geometry or game state.
6. Run full typecheck and unit suite, targeted UI verification and selected existing e2e checks where environment permits. Review diff, create conventional commit and PR. Owner handles merge/publication.

Review focus: no timing changes in moon calculations; all three matrix meanings remain available; labels never imply prediction; SVG IDs unique; new UI does not send or persist private data; dialogs close with Escape and restore focus; original artwork retains full aspect ratio.
