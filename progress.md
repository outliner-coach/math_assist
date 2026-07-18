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

## 2026-05-11

- Completed a continuity handoff for future agents:
  `handoffs/2026-05-11-grade2-continuity-codex.md`.
- The handoff records the latest pushed commit, GitHub Pages deployment status,
  Grade 2 visual-safety contracts, length-input contracts, classification-table
  behavior, verification commands, browser QA routes, known non-issues, and
  suggested next work.

## 2026-07-18

- Added all three missing Grade 5 geometry units: perimeter/area,
  congruence/symmetry, and cuboids/nets.
- Added six concepts and 180 deterministic templates. Each geometry unit now
  has 20 distinct problem families. Each concept has three 10-template practice
  sets (A/B/C), with difficulty levels 1/2/3 distributed 4/4/2 in every set.
- Added reusable data-driven SVG renderers for polygons, congruence,
  symmetry, cuboids, and cuboid nets. Answer-only labels and construction
  marks remain hidden until the result view.
- Extended the deterministic problem generator and quality audit to resolve
  geometry visual templates from the same parameters used for prompts and
  answers.
- Added focused unit/component regression tests and a complete browser E2E
  learning loop for geometry reveal safety.
- Local verification completed: template validation, strict problem audit,
  Grade 1/2 validators, mission audit, 80 Vitest tests, 13 Playwright tests,
  lint, build, and 841 promptfoo quality assertions.

## 2026-07-18 - Grade 1/2 replay and rewards

- New request: expand Grade 1/2 beyond the current one-hour fixed path and
  deepen the reward system.
- Selected `workstreams/02-learning-loop` as the primary lane. Content bank and
  reward UI changes are coordinated through `workstreams/_shared/README.md`.
- Confirmed the root limitation: Grade 1 renders 60 missions with one fixed
  seed, Grade 2 renders 72 missions with one fixed seed, and both progress
  schemas treat a mission ID as a one-time completion.
- Implementation target: daily deterministic variants, replay-safe variant
  keys, progress schema v2, spaced mastery stars, XP/levels/streaks/daily goal,
  96 Grade 1 missions, and 144 Grade 2 missions.
- Added `adventure-progression.ts` with daily/replay seeds, concrete variant
  keys, XP, levels, gentle streaks, 1/3/7/21-day review scheduling, three-star
  mastery, daily-goal achievements, and duplicate-reward protection.
- Migrated both grade progress schemas from v1 to v2 while preserving old
  completion/review/unit data. Focused progression and migration tests pass.
- Expanded the Grade 1 bank to 96 missions and the Grade 2 bank to 144 missions
  (12 per unit, with a 4/4/4 easy/medium/applied distribution). Existing mission
  IDs remain stable so stored progress continues to resolve.
- Added long-run seed checks for at least 500 Grade 1 and 340 Grade 2 concrete
  problem signatures across 200 daily/replay seeds. The combined verified floor
  is 840 variants; this is a conservative test bound, not a claimed hard cap.
- Added the shared adventure progress panel, XP/level bar, gentle streak, 8-task
  daily goal, mastery stars, achievements, duplicate variant reward protection,
  and a Grade 2 reward collection. Hints remain free; first-try and due-review
  bonuses reward productive behavior without penalizing help-seeking.
- Replaced fixed UI seeds with deterministic daily/replay seeds. Both grades now
  expose a direct `한 번 더 풀기` action that keeps the mission context. Reward
  keys fingerprint rendered problem content, so a changed seed cannot farm XP
  when a fixed-data mission happens to repeat exactly.
- Focused Grade 1/2 replay E2E tests pass. The required game-client screenshot
  checks found no console errors; visual review also changed the 12-node Grade 2
  unit list to a tablet-friendly two-column grid.
- Full verification passed: 91 Vitest tests, lint, TDD guard, production build,
  and 13 Playwright E2E scenarios. A final date-boundary review found and fixed
  a UTC/local mismatch so daily seeds, streaks, and the daily goal now share the
  learner device's local midnight; the focused 21-test progression suite passes.
- Documented the V1 contracts in `docs/grade1-grade2-replay-rewards-v1.md` and
  added `handoffs/2026-07-18-grade1-grade2-replay-rewards-codex.md`.
- Strengthened duplicate protection to fingerprint rendered prompt, answer,
  choices, and visual data instead of trusting the seed alone. The Grade 2 fixed
  first mission now has an E2E assertion that replay grants no duplicate XP or
  daily-goal credit.
- Final game-client state and screenshots passed after the copy/variant-key
  change: Grade 1 reward state reported XP 15 and mastery 2 stars, Grade 2 showed
  the 12-mission unit and reward collection, and neither run emitted an error
  artifact. Final TODO: preserve content-based variant keys and raise the 500/340
  signature floors when genuinely new generators are added.
