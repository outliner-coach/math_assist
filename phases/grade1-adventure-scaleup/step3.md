# Step 3 - Data-driven Adventure UI

## Goal

Wire the Grade 1 UI to the mission bank so the map and mission card are no longer
single-problem demos.

## Workstream

Use `workstreams/03-ui-and-visuals/`. Coordinate through `_shared` before changing
the Grade 1 problem contract.

## Primary Files

- `src/app/grade/1/Grade1GameClient.tsx`
- `src/components/grade1/GameMap.tsx`
- `src/components/grade1/MissionProblemCard.tsx`
- `src/components/grade1/StageNode.tsx`
- `src/components/grade1/grade1-components.test.ts`

## Requirements

- Render stages from the Grade 1 mission bank instead of the static local array.
- Let a learner select an open stage and see the corresponding mission.
- Add visual renderers for these models:
  - `counting-grid`
  - `object-groups`
  - `number-cards`
- Keep touch targets large and tablet-first.
- Implement first-wrong and repeated-wrong UI states from
  `docs/grade1-adventure-scaleup.md`.
- Keep repeated answer taps idempotent so rewards do not duplicate.
- Preserve layout dimensions when an asset falls back.
- Do not add persistence in this step.

## Acceptance Criteria

- Component tests cover selecting at least two different stage missions.
- The first mission still matches the old apple-counting behavior.
- Component tests cover a wrong answer opening a hint and a repeated answer not
  duplicating success UI.
- `npm run test` passes.
- `npm run build` passes.
