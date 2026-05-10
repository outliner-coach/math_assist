# Step 3 - Alpha Mission Bank

## Goal

Provide representative Grade 2 Alpha coverage across all 12 semester units.

## Workstream

Use `workstreams/01-content-and-curriculum/`.

## Primary Files

- `src/lib/grade2-problems.ts`
- `src/lib/grade2-problems.test.ts`

## Requirements

- Add 36 templates: 12 units x 3 missions.
- Keep each unit ordered as `easy`, `medium`, `applied`.
- Treat Alpha as structure validation, not full Grade 2 mastery volume.
- Preserve Beta and V1 volume targets in planning notes: 72 and 120 templates.

## Acceptance Criteria

- Every unit has exactly three missions.
- Every mission has at least two hints and a solution path.
- Every mission maps to a `[2수..]` curriculum code.
