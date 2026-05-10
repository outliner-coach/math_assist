# Step 4 - Unit Flow and Visuals

## Goal

Add `/grade/2` with a child-friendly unit-first flow and Grade 2 visual models.

## Workstream

Use `workstreams/03-ui-and-visuals/`.

## Primary Files

- `src/app/grade/2/Grade2GameClient.tsx`
- `src/app/grade/2/page.tsx`
- `src/components/grade2/Grade2MissionCard.tsx`
- `src/components/grade2/Grade2MissionVisual.tsx`
- `src/components/grade2/grade2-components.test.ts`

## Requirements

- Show 12 unit cards first, then only the selected unit's three missions.
- Use structured inputs for length, time-of-day, and duration.
- Keep one problem per screen, hint/retry flow, reward-to-next-unit-mission, and
  local progress recovery.
- Keep visual fallback behavior so a bad visual config does not remove the
  prompt or answer controls.

## Acceptance Criteria

- Unit selection, structured inputs, hints, success, reward, and next mission
  surfaces render in focused tests.
- `/math_assist/grade/2/` works with static export base path.
