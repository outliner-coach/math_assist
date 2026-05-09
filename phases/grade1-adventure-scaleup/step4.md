# Step 4 - Progress and Review Loop

## Goal

Add local-only adventure progress so the scaled mission set feels like a game
rather than a static gallery.

## Workstream

Use `workstreams/02-learning-loop/`.

## Primary Files

- `src/app/grade/1/Grade1GameClient.tsx`
- `src/lib/grade1-progress.ts`
- `src/lib/grade1-progress.test.ts`
- `src/components/grade1/RewardReveal.tsx`
- `src/components/grade1/StageNode.tsx`

## Requirements

- Store Grade 1 progress in localStorage only.
- Track completed stage ids, latest selected stage id, and review-needed stage ids.
- Track `todaySolvedCount`, `skillSummaryByTag`, `lastPlayedAt`, and
  `schemaVersion` for a simple parent summary.
- Unlock the next stage after a correct answer.
- Mark wrong answers for review but keep grading binary.
- Recover from corrupt localStorage by resetting only Grade 1 progress.
- Continue in memory when localStorage is unavailable.
- Preserve a reset path for manual testing.

## Acceptance Criteria

- Unit tests cover load, save, expiry/clear, unlock, and review-needed behavior.
- Unit tests cover corrupt localStorage, unavailable localStorage, and schema
  version mismatch behavior.
- Component tests verify complete, open, locked, and review stage states.
- The page exposes a simple summary of today's solved count and review
  recommendation without adding server state.
- `npm run test` passes.
- `npm run build` passes.
