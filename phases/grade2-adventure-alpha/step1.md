# Step 1 - Contract and Validator

## Goal

Add a Grade 2-specific mission contract without changing the older static
practice flow.

## Workstream

Use `workstreams/01-content-and-curriculum/`.

## Primary Files

- `src/lib/grade2-problems.ts`
- `src/lib/grade2-problems.test.ts`
- `scripts/validate-grade2-problems.js`

## Requirements

- Define Grade 2 units, mission templates, answer types, visual models, and
  safe fallback mission.
- Require `unitId`, `semester`, `curriculumCode`, `difficultyStep`, and
  `answerConfig` on every mission.
- Validate 36 Alpha missions, three missions per unit, unique ids and stage
  orders, choice integrity, visualConfig fields, and graph/classification count
  consistency.

## Acceptance Criteria

- `npm run validate:grade2` passes.
- `npm run test -- src/lib/grade2-problems.test.ts` passes.
