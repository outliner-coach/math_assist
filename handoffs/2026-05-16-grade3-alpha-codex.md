# 2026-05-16 Grade 3 Alpha handoff

## What changed

- Added Grade 3 Adventure Alpha under `/grade/3`.
- Added 12 Grade 3 units with 36 total missions in `src/lib/grade3-problems.ts`.
- Added Grade 3 structured answer normalization in `src/lib/grade3-answer-normalizers.ts`.
- Added Grade 3 progress storage in `src/lib/grade3-progress.ts` using
  `mathAssist_grade3Progress`.
- Added Grade 3 UI components in `src/components/grade3/**`.
- Added Grade 3 routes in `src/app/grade/3/**`.
- Added `npm run validate:grade3`.
- Extended `npm run audit:missions` to cover Grade 1, Grade 2, and Grade 3.
- Added Grade 3 unit, normalizer, progress, component, and E2E coverage.
- Updated `docs/problem-quality-evaluation.md`.
- Added detailed implementation notes in `docs/grade3-alpha-implementation.md`.

## Current contracts

- Grade 3 Alpha is 36 missions: 12 units x 3 missions.
- Each unit has exactly one `easy`, one `medium`, and one `applied` mission.
- Every Grade 3 mission keeps `[4수..]` curriculum traceability.
- Scaffold interactions are not scored.
- Input-format errors are not recorded as wrong attempts.
- All Grade 3 grading is deterministic through normalizers.
- Grade 3 visual answer-only values must remain masked until success or
  solution-path reveal.
- Grade 3 storage recovery must not touch Grade 1 or Grade 2 progress keys.

## Verification

Passed:

- `npm run validate:grade1`
- `npm run validate:grade2`
- `npm run validate:grade3`
- `npm run audit:missions`
- `npm run test`
- `npm run lint`
- `npm run build`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`
- `npm run tdd:guard`

E2E result: `15 passed`.

Local server for manual review:

- `http://localhost:3124/math_assist/grade/3`

## Still risky

- Alpha coverage is representative, not mastery-level.
- Grade 3 visual models need child-facing review for clarity, especially
  fractions, angles, and unit measurement.
- Exact 3학년 교과서 단원명 should be checked before Beta scaling because the
  official achievement standards are grouped as 3-4학년군.
- The Grade 3 implementation intentionally stays grade-specific. Shared Grade
  2/3 extraction should wait until there is concrete duplication pressure.

## Next agent should do

- Start with `docs/grade3-alpha-implementation.md`.
- Run `npm run validate:grade3` after any content edit.
- Run `npm run audit:missions` before handoff.
- For visual changes, add hidden/revealed renderer tests.
- For learner-facing changes, run `PLAYWRIGHT_PORT=3111 npm run test:e2e` and
  inspect `/math_assist/grade/3` manually.
