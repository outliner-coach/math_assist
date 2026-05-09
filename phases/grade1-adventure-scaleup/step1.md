# Step 1 - Grade 1 Problem Contract

## Goal

Extract the current hardcoded Grade 1 apple counting mission into a deterministic
Grade 1 problem contract and small problem bank.

## Workstream

Use `workstreams/01-content-and-curriculum/` for content logic and update
`workstreams/_shared/README.md` if the contract becomes shared with UI.

## Primary Files

- `src/lib/grade1-problems.ts`
- `src/lib/grade1-problems.test.ts`
- `src/components/grade1/MissionProblemCard.tsx`
- `src/components/grade1/grade1-components.test.ts`

## Requirements

- Define Grade 1-specific types for mission templates, rendered missions, visual
  model, and answer type.
- Represent the existing "사과는 모두 몇 개일까요?" mission as data.
- Add a deterministic render/generate function that accepts a seed and returns a
  concrete mission.
- Include `learnerGoal` and `parentSummaryTag` fields so UI and parent summary
  work can group progress without parsing prompt text.
- Provide a known safe fallback mission for runtime generation failures.
- Preserve current learner-facing behavior on `/grade/1`.
- Keep correctness binary and rule-based.

## Acceptance Criteria

- Existing Grade 1 component tests pass.
- New tests prove that the apple mission renders answer `7`, choices include only
  one correct answer, and hint/solution text is present.
- New tests prove that missing or bad mission ids fall back to a safe mission
  instead of throwing in the UI path.
- `npm run test` passes.
- `npm run build` passes.
