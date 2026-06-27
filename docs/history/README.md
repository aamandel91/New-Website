# docs/history/

Historical planning, implementation, and phase-completion documents from the
build-out of this site. Kept in the repo for context and traceability — not
necessarily current.

These files were moved here from the repo root on 2026-06-27 so AI coding
agents (Claude Code, Codex, Cursor, etc.) and casual readers stop auto-loading
them on every session. The content is unchanged; full git history is preserved
via `git mv` (use `git log --follow <file>` to trace each one back).

## Contents

| File | What it covers |
|---|---|
| [`ADMIN_PANEL_IMPLEMENTATION_PLAN.md`](./ADMIN_PANEL_IMPLEMENTATION_PLAN.md) | Original plan for the admin panel build-out. |
| [`SEO_TEMPLATES_IMPLEMENTATION_GUIDE.md`](./SEO_TEMPLATES_IMPLEMENTATION_GUIDE.md) | Implementation guide for the SEO templates feature. |
| [`SEO_OPTIMIZATION_GUIDE.md`](./SEO_OPTIMIZATION_GUIDE.md) | Site-wide SEO strategy and optimization reference. |
| [`IMPLEMENTATION_NOTES.md`](./IMPLEMENTATION_NOTES.md) | Cross-cutting implementation notes captured during build. |
| [`PHASE_1_COMPLETE.md`](./PHASE_1_COMPLETE.md) | Phase 1 completion writeup. |
| [`PHASE_1_AND_2_COMPLETE.md`](./PHASE_1_AND_2_COMPLETE.md) | Phase 1 + 2 completion writeup. |

## When to read these

- You need historical context on *why* something was built a certain way.
- You're onboarding and want a tour of past phases.
- You want to verify whether a current behavior matches what was originally
  planned.

## When NOT to rely on these

- As a spec for current behavior — the code is the source of truth.
- As an active TODO list — anything still pending should live in issues or in
  `docs/` proper, not here.

If a document here is no longer accurate and you want to either fix it or
delete it, do that in a separate PR with a clear note in the message.
