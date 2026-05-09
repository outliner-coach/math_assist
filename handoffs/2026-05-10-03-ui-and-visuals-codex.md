# 2026-05-10 Grade 1 Reward-to-Next UX Handoff

## What changed

- Added a direct `다음 미션 풀기` action to the Grade 1 reward reveal so a learner
  can continue without returning to the map.
- Split next-path selection from review-first recommendation logic in
  `src/app/grade/1/Grade1GameClient.tsx`.
- Kept `오늘 추천 미션` review-first, but made the reward continuation choose the
  first unlocked incomplete mission.
- Updated `src/components/grade1/RewardReveal.tsx` to show the next stage label
  and three clear actions: `다음 미션 풀기`, `다시 풀기`, `지도 보기`.
- Expanded `e2e/learning-loop.spec.ts` so the tested flow is now wrong answer,
  hint, correct answer, reward, and direct move to `count-cove-02`.
- Updated `docs/grade1-adventure-scaleup.md` so future agents see the current
  Alpha implementation state instead of the older one-mission planning baseline.

## Reading order for the next agent

1. `docs/grade1-adventure-scaleup.md`
2. `src/app/grade/1/Grade1GameClient.tsx`
3. `src/components/grade1/RewardReveal.tsx`
4. `e2e/learning-loop.spec.ts`
5. `src/lib/grade1-problems.ts` and `src/lib/grade1-progress.ts`

## Current risk

- `오늘 추천 미션` still prioritizes review missions. That is acceptable for a
  recommendation surface, but it may feel inconsistent during a same-day streak
  if the learner expects every primary CTA to advance along the path.
- The reward panel was browser-checked on desktop width. Any future mobile layout
  change should re-check that three action buttons do not wrap awkwardly or hide
  the next-stage label.
- The repo still has unrelated dirty harness/TDD migration files. Do not include
  them in Grade 1 UX commits unless the task explicitly covers harness work.

## Verification completed

- `npm run lint`
- `npm run validate:grade1`
- `npm run test -- src/lib/grade1-progress.test.ts src/lib/grade1-problems.test.ts src/components/grade1/grade1-components.test.ts`
- `npm run build`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`
- `npm run tdd:guard`
- Browser check on `http://127.0.0.1:3112/math_assist/grade/1/`

## Next suggested step

- Decide whether `오늘 추천 미션` should prefer the next unlocked incomplete stage
  while the learner is in an active play streak, then return to review-first when
  the learner starts a later session.
