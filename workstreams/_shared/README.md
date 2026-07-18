# Shared Contracts

Use this page when a change crosses workstream boundaries.

## High-conflict files

- `src/lib/types.ts`
- `src/lib/problem-generator.ts`
- `src/lib/session.ts`
- `public/data/concepts.json`
- `public/data/templates/*.json`

## Update rule

When you change a high-conflict file, add a short dated note below:

- date
- file
- what changed
- what dependent workstreams should re-check

## Notes

- 2026-07-18: `src/lib/types.ts`, `src/lib/session.ts`, `src/app/practice/**`, `src/components/**`
  The shared Grade 4/5 practice flow now persists `PracticeSession.checkedAnswers`
  so each problem can be graded and explained immediately before navigation. Old
  localStorage sessions normalize to unchecked entries. Re-check result creation,
  retry sessions, progress indicators, and any code that constructs a practice
  session directly.

- 2026-07-18: `src/lib/types.ts`, `src/lib/problem-generator.ts`, `src/components/ProblemCard.tsx`, `src/components/ResultCard.tsx`
  Grade 5 practice problems now support parameter-resolved `GeometryVisual` payloads shared by prompts, deterministic solvers, SVG practice rendering, and result rendering. Answer-only visual annotations remain hidden until `showAnswer` is enabled. Re-check session persistence, result snapshots, template validation, and tablet rendering when changing the shared `Problem` contract.

- 2026-03-07: collaboration structure added. No runtime contract changed in this step.
- 2026-03-07: `src/lib/types.ts`, `src/lib/session.ts`
  action-centered retry loop added with `PracticeSession.mode`, retry source metadata,
  `SubmissionResult.problem` snapshots, `SessionResult.wrongCount`, and local progress summaries.
  Re-check learning loop UI, result rendering, and any tests that assume fixed 10-question sessions.
- 2026-03-07: `public/data/templates/commonden.json`
  commonden prompt copy now shows the actual fractions and target common denominator with KaTeX-friendly notation.
  Re-check any content tests or screenshots that assume the old plain-text prompt wording.
- 2026-03-07: `src/lib/problem-generator.ts`, `public/data/templates/fracadd.json`, `public/data/templates/fracsub.json`, `public/data/templates/fracmul.json`
  session generation now rejects duplicate rendered prompts inside one 10-problem set, and fraction templates were reworded/re-leveled so prompt clarity and difficulty gates pass.
  Re-check any flows or snapshots that depend on prior prompt copy or assume duplicate wording can appear in one session.
- 2026-05-09: Grade 1 Adventure Scale-up is tracked in `docs/grade1-adventure-scaleup.md`
  and `phases/grade1-adventure-scaleup/`. Start with a Grade 1-specific problem contract in
  `src/lib/grade1-problems.ts` instead of changing `src/lib/problem-generator.ts` immediately.
  The initial target is 24 Alpha mission templates, then 60 Beta templates, then 96 V1
  templates. UI agents should consume the contract through `src/components/grade1/**`; content
  agents own deterministic templates and tests; quality agents own validation and E2E gates.
  The plan also requires learner journey, wrong-answer hint policy, parent summary metadata,
  and runtime recovery for localStorage, missing stages, missing assets, and repeated answer taps.
- 2026-05-10: `src/lib/grade1-progress.ts`
  Grade 1 progress now includes `introDismissedAt: number | null` for the
  first-start guide. Existing stored progress without the field must normalize to
  `null`; reset should clear it. UI and learning-loop agents should use this
  field only for onboarding visibility, not for reward or stage completion.
- 2026-05-11: Grade 1/2 Beta scale-up
  Grade 1 now has 60 mission templates and Grade 2 now has 72 mission templates
  with 6 missions per unit. `Grade2MissionCard` now receives `missionCount`
  instead of assuming `/3`, and `unitMissionOrder` is no longer limited to
  `1 | 2 | 3`. Re-check mission navigation, tests, and browser QA if another
  workstream touches Grade 1/2 mission banks, Grade 2 mission cards, or progress
  copy. The handoff is `handoffs/2026-05-11-grade1-grade2-beta-scaleup-codex.md`.
- 2026-07-18: Grade 1/2 replay expansion is owned by the learning-loop lane but
  changes content-bank counts and reward UI. Both grade progress schemas move to
  v2 with shared deterministic variant, XP, streak, daily-goal, and mastery
  helpers. Existing v1 localStorage data must migrate without losing completion
  or review IDs.
- 2026-05-16: Grade 3 Alpha implementation
  Grade 3 now has a grade-specific Alpha contract under `src/lib/grade3-problems.ts`,
  `src/lib/grade3-answer-normalizers.ts`, `src/lib/grade3-progress.ts`,
  `src/components/grade3/**`, and `src/app/grade/3/**`. The shared mission-bank
  gate now includes `validate:grade3` and Grade 3 inside `audit:missions`.
  Re-check content, UI, and quality workstreams when touching mission-bank
  validation, structured answer normalizers, visual answer masking, or progress
  storage. The detailed note is `docs/grade3-alpha-implementation.md`; the
  handoff is `handoffs/2026-05-16-grade3-alpha-codex.md`.
- 2026-07-18: Grade 5 geometry quality upgrade (primary workstream 01, UI dependency on workstream 03)
  `src/lib/types.ts` and `src/lib/problem-generator.ts` now support an optional
  evaluated `visual_template` / `visual` contract. Grade 5 `area-001` uses five
  answer-safe SVG models, while the shared practice route mounts a temporary
  pointer-based `ScratchPad` beside every problem at tablet widths. Re-check
  answer masking, serialized `Problem` compatibility, responsive practice
  layout, and renderer tests when changing the generator or practice UI. The
  handoff is `handoffs/2026-07-18-grade5-quality-upgrade-codex.md`.
