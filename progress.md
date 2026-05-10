Original prompt: /goal 제안한 계획대로 브라우저 테스트까지 마친 상태로 실제 바로 사용할 수 있는 수준까지 구현해주세요.

## 2026-05-09

- Started Grade 1 adventure scale-up implementation.
- Planned implementation order: deterministic mission bank, data-driven UI, local progress recovery, validator/tests, browser verification.
- Added Grade 1 mission bank, progress persistence helpers, data-driven map/mission UI, mission visual renderers, and validator script.
- Validator, unit tests, build, and Playwright E2E passed after fixing trailing slash expectations and StrictMode storage recovery.
- Browser screenshot flow reached reward state; added priority loading for the above-fold adventure map after a Next LCP warning.
- Reviewed the post-reward Grade 1 UX flow and added a direct "다음 미션 풀기" path from the reward reveal so learners do not need to return to the map before continuing.
- Verified the reward-to-next-mission flow with focused Vitest, lint, build, full Playwright E2E, and a browser screenshot check. Next UX candidate: review whether "오늘 추천 미션" should prefer the next path over review items during the same play streak.

## 2026-05-10

- Investigated the Grade 2 subtraction screenshot issue where the visual for
  `52 - 28` showed the answer `24` before the learner submitted an answer.
- Root cause: `Grade2MissionVisual` rendered answer-only fields such as
  `visualConfig.result` unconditionally, and `Grade2MissionCard` did not pass a
  reveal state to the visual renderer.
- Added a `showAnswer` reveal gate. The mission card now reveals answer-only
  visual values only after the problem is solved or the solution path is
  intentionally shown.
- Masked answer-only values before reveal for `vertical-operation`, expanded
  number cards, multiplication table products, and the equivalent-length visual
  label case.
- Added regression coverage:
  - focused renderer assertions in
    `src/components/grade2/grade2-components.test.ts`
  - browser E2E for `g2-1-add-sub-02` in `e2e/learning-loop.spec.ts`
- Documented the new visual-safety rule in `AGENTS.md`,
  `workstreams/03-ui-and-visuals/README.md`, and
  `docs/grade2-curriculum-implementation-notes.md`.
- Added next-agent handoff:
  `handoffs/2026-05-10-grade2-visual-answer-safety-codex.md`.
- Verification completed:
  `npm run validate:grade2`,
  `npm run lint`,
  `npm run test`,
  `npm run tdd:guard`,
  `npm run build`,
  `PLAYWRIGHT_PORT=3111 npm run test:e2e`,
  plus an in-app browser check on local port `3002`.
