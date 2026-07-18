# Grade 3 Adventure Alpha Implementation

Date: 2026-05-16
Owner lane: `workstreams/01-content-and-curriculum`

## Purpose

This note documents the Grade 3 Adventure Alpha added under `/grade/3`.
It is a representative implementation slice, not a full mastery bank.

The Alpha proves:

- 12 Grade 3 units with 3 missions each
- one `easy`, `medium`, and `applied` mission per unit
- Grade 3 structured answer types
- non-scored scaffold interactions
- answer-safety masking for visual models
- Grade 3 progress recovery in its own localStorage namespace
- validation and E2E gates that include Grade 3

## Read First

1. `AGENTS.md`
2. `docs/problem-quality-evaluation.md`
3. `docs/grade2-lessons-learned.md`
4. `src/lib/grade3-problems.ts`
5. `src/lib/grade3-answer-normalizers.ts`
6. `src/lib/grade3-progress.ts`
7. `src/components/grade3/Grade3MissionCard.tsx`
8. `src/components/grade3/Grade3MissionVisual.tsx`
9. `src/app/grade/3/Grade3GameClient.tsx`
10. `e2e/learning-loop.spec.ts`

## What Changed

- Added the Grade 3 unit-selection route at `/grade/3`.
- Added the Grade 3 mission route at `/grade/3/mission?unitId=...`.
- Added a home-page entry card for `3학년 탐험섬`.
- Added `src/lib/grade3-problems.ts` as the Grade 3 mission-bank source of truth.
- Added `src/lib/grade3-answer-normalizers.ts` for deterministic Grade 3 grading.
- Added `src/lib/grade3-progress.ts` using `mathAssist_grade3Progress`.
- Added `src/components/grade3/**` for Grade 3 mission cards and visual renderers.
- Added `scripts/validate-grade3-problems.js` and `npm run validate:grade3`.
- Extended `scripts/mission-bank-quality-core.js` so `npm run audit:missions`
  covers Grade 1, Grade 2, and Grade 3.
- Extended E2E coverage with Grade 3 unit selection, scaffold use, input-error
  handling, structured input, and answer masking.

## Current Grade 3 Alpha Contract

Mission bank:

- `grade3MissionTemplates.length === 36`
- `grade3Units.length === 12`
- each unit has exactly 3 missions
- each unit has exactly one `easy`, one `medium`, and one `applied` mission
- every mission has a `[4수..]` `curriculumCode`
- every mission has `learnerGoal`, at least two hints, and solution steps
- `answerConfig.kind` must equal `answerType`

Answer types:

- `choice`
- `integer`
- `label`
- `fraction`
- `decimal`
- `length`
- `time-of-day`
- `duration`
- `capacity`
- `weight`
- `angle`

Progress:

- storage key: `mathAssist_grade3Progress`
- corrupt Grade 3 storage is recovered without touching Grade 1 or Grade 2 keys
- input-format errors are not recorded as wrong attempts
- scaffold clicks are not scored

Visual reveal:

- `Grade3MissionCard` owns the reveal boundary.
- visual answers are hidden before success or solution-path reveal.
- answer-only values such as operation results, final fractions, final graph
  counts, and masked measurement values must wait for `showAnswer`.

## User Experience Rules

- Keep one mission as the primary focus.
- Use scaffold choices as a thinking aid, not as a scored answer.
- Prefer structured inputs over free text.
- For fractions, use numerator and denominator fields or choices.
- For measurement, split large and small units into separate fields.
- For geometry, prefer tap-to-select and readable diagrams over free drawing.
- Do not introduce AI-based grading.

## Verification Already Completed

The following passed after the Grade 3 Alpha implementation:

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

Local manual check:

- server: `http://localhost:3124`
- checked route: `/math_assist/grade/3`
- checked route: `/math_assist/grade/3/mission?unitId=g3-1-fraction-decimal`

Known local non-issue:

- `favicon.ico` 404 appears in local dev browser logs and is unrelated to Grade
  3 behavior.

## Still Risky

- The Alpha has only 36 missions and should not be described as full Grade 3
  mastery coverage.
- The visual models are intentionally simple and deterministic. They are good
  enough for Alpha but still need learner-facing review for clarity.
- Some Grade 3 curriculum standards are officially written for the 3-4 grade
  band. Keep `[4수..]` traceability and check exact adopted textbook unit names
  before scaling to Beta.
- The implementation is Grade 3-specific by design. Do not prematurely extract
  shared Grade 2/3 components until duplication pain is concrete.

## Suggested Next Work

- Do a learner pass on all 36 Grade 3 missions on mobile, tablet, and desktop.
- Classify findings as input friction, visual ambiguity, answer leakage,
  curriculum fit, or difficulty mismatch.
- Expand from Alpha to Beta only after the scaffold and visual contracts survive
  the learner pass.
- If adding new visual models, add renderer tests for both hidden and revealed
  states in the same change.
