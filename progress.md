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

## 2026-07-26 - Full curriculum completion

- Current goal: complete every remaining Grade 1-6 unit with challenging
  application problems, committing and pushing after each unit.
- Completed and publicly verified all 11 Grade 6 Study units. The last release,
  `g6ratiograph-001`, added 30 disjoint K/A/R ratio-graph problem families,
  shared quantitative band/circle rendering, 100% model validation, full
  browser regression, commit `7f52317`, and successful GitHub Pages run
  `30182787657`.
- A ledger audit found nine remaining planned standards: Grade 3
  `[4수03-19]`, `[4수03-22]`, `[4수03-23]`; Grade 5 `[6수01-02]`,
  `[6수01-07]`, `[6수03-12]`, and `[6수04-04]`~`[6수04-06]`.
- Next implementation target: extend the existing Grade 3
  `g3-2-capacity-weight` adventure unit with capacity/weight addition and
  subtraction plus tonne conversion, then run the required game-client,
  screenshot, text-state, console, full regression, commit, push, Pages, and
  live-browser gates.
- Expanded `g3-2-capacity-weight` from three to seven stable-ID missions after
  the RED contract exposed that released `[4수03-21]` had no actual kg-to-g
  conversion mission. The unit now assigns one mission to every
  `[4수03-17]`~`[4수03-23]` standard, including carry/borrow applications,
  L/mL and kg/g conversion, and a four-tonne application.
- Added quantitative capacity-operation, weight-operation, and tonne-block
  renderers. Given operands and the `1t = 1000kg` relation stay visible while
  calculated results remain masked until a correct answer.
- Added Grade 3 browser automation text/time hooks and promoted the three
  formerly planned ledger rows to released. Focused Grade 3/component/ledger
  tests pass (17), curriculum validation reports 86 current references, and
  the mission-bank audit reports 0 errors and 0 warnings.
- Next: run Grade 3 validation, lint/TDD/build/E2E, the required game-client
  screenshot/text/error inspection, then document, commit, push, deploy, and
  live-verify this unit.
- Full Vitest now passes 557 tests and the production build emits 105 static
  pages. Grade 3 validation, lint, TDD guard, mission audit, and curriculum
  validation are clean.
- The required web-game client ran against all five changed/new missions and
  wrote screenshots plus `render_game_to_text` state with no error artifacts.
  Because its canvas-first capture selected the ScratchPad canvas, the actual
  mission UI was additionally reviewed at 390x844 in a controlled browser.
  All seven missions were solved correctly; every result was `□` before
  checking, all answer reveals matched, no horizontal overflow occurred, and
  no browser console/page errors appeared.
- Added and passed a focused mobile E2E scenario that solves all seven
  capacity/weight missions, checks the quantitative tonne blocks, answer
  masking/reveal, overflow, and the automation text-state contract.
- Next: full E2E regression, documentation/handoff, commit/push, Pages
  deployment, and public live verification.
- Grade 3 capacity/weight completion shipped as commit `fcbd9fd` on `main`.
  GitHub Pages run `30183280884` completed its build and deploy jobs
  successfully.
- A fresh-cache public browser opened the deployed 390x844 route and solved
  all seven missions again. The page exposed seven nodes, four quantitative
  tonne blocks, masked every result before checking, revealed all seven
  expected answers after checking, had no horizontal overflow, and emitted no
  console/page errors.
- Next implementation scope is now only the six planned Grade 5 standards:
  number ranges, unlike-denominator fraction comparison, area-unit relations,
  and the three possibility/probability standards.
- Started the Grade 5 `unit-5-2-rounding` completion with a new
  `numberrange-001` concept and 30 deterministic A/B/C templates. Each set is
  K4/A4/R2 and difficulty 4/4/2; the bank covers inclusive/exclusive lower and
  upper bounds, bounded counts, real-world qualification, repeated endpoint
  errors, and comparison of two range rules.
- Added a shared quantitative `number_range` visual with one-sided arrows,
  bounded segments, and distinct closed/open endpoint circles. The visual
  carries only given boundaries and never the derived count or boundary
  answer.
- Focused generator/blueprint/renderer/curriculum tests pass. Template
  validation reports 1020/1020 complete. The first quality audit exposed that
  two-sided range constraints were missing from the difficulty heuristic;
  recognizing that genuine compound constraint restored ordered signals
  5.61 < 6.36 < 7.33 and the problem audit is now 0 errors/0 warnings.
- Next: browser routes and 10-item live solving, full release gates,
  documentation, unit commit/push, Pages, and public verification.
- The 390x844 concept and practice routes were inspected in a real browser.
  Closed and open endpoints, one-sided arrows, and bounded segments matched
  the prompt; all ten Set A questions graded correctly with no answer-only DOM
  values, horizontal overflow, console errors, or page errors.
- Full release gates pass: Vitest 65 files and 560/560 tests, lint, TDD guard,
  1020/1020 template validation, both audits at 0 errors/0 warnings, static
  build 107/107, focused E2E 1/1, and full E2E 71/71.
- Next: commit and push the Grade 5 number-range unit, verify Pages and the
  fresh-cache public route, then implement `[6수01-07]` fraction comparison.
- Grade 5 number range shipped as commit `4832b87` on `main`; GitHub Pages run
  `30183741837` completed build and deployment successfully.
- A fresh-cache public 390x844 browser found all three concepts, rendered the
  closed lower and open upper endpoints, generated ten `number_range`
  problems, exposed no pre-check answer nodes/text, and completed Set A 10/10
  with no overflow or console/page errors.
- Next implementation target: `[6수01-07]` unlike-denominator fraction
  comparison as a separate Grade 5 unit commit.
- Added `fraccompare-001` to the existing fraction-simplify unit without
  changing the two existing concept IDs. Its deterministic A/B/C bank has
  K12/A12/R6, ten families, and difficulty 4/4/2 per set.
- All 30 questions render equal-length `fraction_comparison` bars partitioned
  and filled from the two given numerator/denominator pairs. No comparison
  result, difference, cross product, or larger-side marker enters the visual.
- The first audit found that the two reasoning families were easier than the
  application families. They now require validating a wrong numerator- or
  denominator-only judgment and computing its repeated cumulative error;
  difficulty signals are 4.48 < 5.36 < 9.57 and both audits are 0/0.
- Full release gates pass: Vitest 65 files and 563/563 tests, lint, TDD guard,
  template metadata 1050/1050, curriculum 88 current references, static build
  109/109, focused E2E 1/1, and full E2E 72/72.
- A 390x844 real browser inspected the concept bars and all ten Set A
  questions. Partition and fill counts matched every given fraction, the set
  completed 10/10, and answer exposure, overflow, console errors, and page
  errors were all zero.
- Next: document, commit, push, deploy, and publicly verify fraction
  comparison, then implement `[6수03-12]` area-unit relations.
