# Analytics Purchase Tracking Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Correct missing goals, purchase duplication and consent/readiness losses identified by the audit.

**Architecture:** PostgreSQL atomically claims eligible purchases for the authenticated user. A global browser component requests them only after consent and SDK readiness, then emits anonymous ecommerce and product-specific paid goals. Mounted report views separately wait for readiness.

**Tech Stack:** Next.js 16, React 19, TypeScript, Drizzle/PostgreSQL, Vitest/PGlite, Playwright, Yandex Metrika.

**Spec:** `docs/superpowers/specs/2026-10-24-analytics-purchase-tracking.md`.

## Global Constraints

- Keep payment, report access, prices, cookie copy/actions/storage and legal text unchanged.
- No new dependency; counter 113068094 and existing settings remain.
- Anonymous transaction UUID, static product, actual RUB amount only.
- Owner merges and deploys; server claims do not guarantee external network delivery.

## Review Focus

- Multiple browsers and repeated effects must not produce another sale.
- Late consent, SDK loaded before subscription, unmount and revocation must behave correctly.
- Free, historical, foreign and incomplete payments must be excluded.
- Untrusted request bodies cannot select a user or purchase.
- Payloads and error responses cannot expose personal data.

## Tasks

- [x] Register and verify 14 missing goals; preserve existing 28.
- [x] DB: write failing eligibility/concurrency/backfill tests; implement `purchase_analytics` migration and `claimPurchaseAnalytics`; run DB tests and typecheck.
- [x] API: write failing origin/auth/body-spoof/privacy tests; implement session-scoped POST with no-store; run route tests and typecheck.
- [x] Browser: write failing readiness, consent, duplicate, concurrency and payload tests; implement runtime and purchase sender; run targeted tests.
- [x] Integrate SDK readiness/ecommerce, global lifecycle, report and Lila signals; remove browser-local sale deduplication. Redact UUID segments in analytics hit/referrer URLs with red/green tests.
- [x] Update analytics documentation and meaningful end-to-end coverage.
- [x] Run required checks and independent code review: full coverage suite, all-package typecheck, production build, 11 browser scenarios; no review blockers.
- Delivery: commit, push and attach the PR; the PR records check results. Production migration, deployment and live ecommerce acceptance remain pending owner merge.
