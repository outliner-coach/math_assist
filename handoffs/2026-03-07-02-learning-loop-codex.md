## What changed

- Added action-centered retry flow with `PracticeSession.mode`, retry session creation from the last result, and result snapshots embedded in each graded item.
- Added local `progress_v1` summaries and surfaced recent score / review recommendation on concept and unit screens.
- Reworked the result page around next actions, wrong-first review, and fixed CTA branching for retry-vs-new-set.
- Hardened tooling with non-interactive ESLint config, `vitest run`, and new Playwright learning-loop coverage on a dedicated port.

## Current risk

- Progress summaries currently store percent-style scores, so "recent/best" is normalized across 10-question sessions and shorter retry sessions rather than raw counts.
- Retry sessions depend on the last stored result only; there is still no multi-attempt history browser or server persistence.

## Next suggested step

- Add an explicit "retry complete" summary state or recommendation engine that points the learner to the next concept when retry sessions end with 100%.
