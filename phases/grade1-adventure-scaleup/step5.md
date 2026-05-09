# Step 5 - Grade 1 Quality Gates

## Goal

Add validation and E2E coverage so future Grade 1 content can scale without
manual inspection of every mission.

## Workstream

Use `workstreams/04-quality-and-automation/`.

## Primary Files

- `scripts/validate-grade1-problems.js`
- `package.json`
- `e2e/learning-loop.spec.ts` or a new `e2e/grade1-adventure.spec.ts`
- `docs/problem-quality-evaluation.md`
- `handoffs/YYYY-MM-DD-grade1-scaleup-codex.md`

## Requirements

- Add `npm run validate:grade1` or an equivalent script.
- Validate answer determinism, duplicate choices, missing visual config, missing
  hint/solution text, and missing reward ids.
- Validate missing learner goals, missing parent summary tags, impossible stage
  ordering, and unsupported visual models.
- Add Playwright coverage for entering `/grade/1`, choosing a stage, answering
  correctly, seeing a reward, and seeing an incorrect-answer hint.
- Add coverage for corrupt localStorage recovery, repeated answer taps, and
  GitHub Pages base path asset/data assumptions where feasible.
- Document the validation workflow.

## Acceptance Criteria

- `npm run validate:grade1` passes.
- `npm run test` passes.
- `npm run build` passes.
- `npm run test:e2e` passes or any environment blocker is documented in the
  handoff.
