# Step 5 - Quality Gates

## Goal

Verify the Grade 2 Alpha route through validation, unit tests, build, E2E, and
the changed-file TDD guard.

## Workstream

Use `workstreams/04-quality-and-automation/`.

## Primary Files

- `e2e/learning-loop.spec.ts`
- `package.json`
- `phases/grade2-adventure-alpha/index.json`

## Requirements

- Add E2E coverage for direct `/math_assist/grade/2/` access, unit selection,
  hint flow, reward flow, structured length/time inputs, corrupt progress
  recovery, and duplicate submit safety.
- Run focused tests before broad checks.

## Acceptance Criteria

- `npm run validate:grade2`
- `npm run test -- src/lib/grade2-problems.test.ts src/lib/grade2-answer-normalizers.test.ts src/lib/grade2-progress.test.ts src/components/grade2/grade2-components.test.ts`
- `npm run lint`
- `npm run build`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`
- `npm run tdd:guard`
