# 2026-05-10 Grade 1 Intro and Reward Collection Handoff

## What changed

- Moved the repeated bottom explanation cards into a first-start guide shown only
  while `Grade1Progress.introDismissedAt` is `null`.
- Added `dismissGrade1Intro` in `src/lib/grade1-progress.ts`. It preserves older
  localStorage records by normalizing a missing `introDismissedAt` field to
  `null`.
- Added `src/components/grade1/RewardCollection.tsx` for the `보물 가방` surface.
  It counts rewards from completed unique mission ids, so replaying the same
  mission does not inflate the collection.
- Updated `RewardReveal` to show the current reward count, for example
  `숫자 조각 보상, 이제 1개예요.`
- Updated `Grade1GameClient` so `오늘 추천 미션`, map stage selection, answer
  submission, and `안내 닫기` all dismiss the intro guide.
- Expanded unit and E2E coverage for older progress loading, intro dismissal,
  reward collection counts, reward reveal count copy, and the first Grade 1
  reward flow.

## Reading order for the next agent

1. `docs/grade1-adventure-scaleup.md`
2. `handoffs/2026-05-10-03-ui-and-visuals-codex.md`
3. `src/app/grade/1/Grade1GameClient.tsx`
4. `src/components/grade1/RewardCollection.tsx`
5. `src/lib/grade1-progress.ts`
6. `e2e/learning-loop.spec.ts`

## Current risk

- `보물 가방` is currently below the parent summary, not sticky. If the game path
  grows much longer, consider a compact summary near the map or reward reveal.
- `introDismissedAt` intentionally does not create a schema-version migration.
  Keep backward compatibility tests if the progress shape changes again.
- The repo still has unrelated dirty harness/TDD migration files. Keep future
  Grade 1 UX commits scoped to the Grade 1 files unless the task explicitly
  covers harness work.

## Verification completed

- `npm run test`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`
- `npm run build`
- `npm run tdd:guard`
- Browser check on `http://localhost:3112/math_assist/grade/1/`

## Next suggested step

- For the next UI pass, test the `보물 가방` placement on mobile and decide
  whether a compact reward count should also appear near the map header.
