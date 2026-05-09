# Step 2 - Alpha Mission Bank

## Goal

Create the first useful set of Grade 1 adventure missions without touching the
route flow yet.

## Workstream

Use `workstreams/01-content-and-curriculum/`.

## Primary Files

- `src/lib/grade1-problems.ts`
- `src/lib/grade1-problems.test.ts`
- Optional: `docs/grade1-adventure-scaleup.md` if scope is adjusted

## Requirements

- Add at least 24 mission templates across these islands:
  - Count Cove
  - Order Bridge
  - Orchard Port
  - River Dock
- Include difficulty levels 1, 2, and 3.
- Include both `choice` and `number` answers where age-appropriate.
- Keep visual models limited to values already declared in the contract.
- Keep prompts short enough for Grade 1 learners: one main instruction, direct
  numbers, and no multi-clause story unless difficulty is 3.
- Include `learnerGoal` and stable `parentSummaryTag` values for every template.
- Add tests for duplicate choices, missing reward ids, and missing hint/solution
  text.

## Acceptance Criteria

- At least 24 templates exist.
- Every template has a deterministic answer for several seeds.
- Every choice mission has exactly one correct choice and no duplicate choices.
- Every template has non-empty hint, solution, learner goal, and parent summary
  metadata.
- `npm run test` passes.
- `npm run build` passes.
