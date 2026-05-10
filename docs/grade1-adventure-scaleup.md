# Grade 1 Adventure Scale-up Plan

Date: 2026-05-09
Owner lane: `workstreams/_shared`

## Current Baseline

The Grade 1 game has reached the Alpha target:

- Route: `/grade/1`
- UI shell: `src/app/grade/1/Grade1GameClient.tsx`
- Mission component: `src/components/grade1/MissionProblemCard.tsx`
- Asset manifest: `src/lib/grade1-assets.ts`
- Mission bank: 24 deterministic Alpha templates in `src/lib/grade1-problems.ts`
- Progress storage: localStorage via `src/lib/grade1-progress.ts`
- Validation: `npm run validate:grade1`

The scale-up should preserve the deterministic core rule: answers and grading are
rule-based, while character copy and feedback can stay presentation-only.

## 2026-05-11 Beta Closeout

The Beta scale-up is complete for the current target:

- Grade 1 mission bank: 60 templates.
- Grade 2 mission bank: 72 templates, tracked separately in
  `docs/grade2-lessons-learned.md`.
- Shared mission-bank quality gate: `npm run audit:missions`.
- Handoff: `handoffs/2026-05-11-grade1-grade2-beta-scaleup-codex.md`.

Current verification set:

- `npm run validate:grade1`
- `npm run validate:grade2`
- `npm run audit:missions`
- `npm run test`
- `npm run lint`
- `npm run build`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`
- `npm run tdd:guard`

Browser QA confirmed `/math_assist/grade/1/` on mobile shows the 60-mission
Beta copy and map-first flow without visible overlap. Grade 2 browser QA is
documented in `docs/grade2-lessons-learned.md`.

## 2026-05-10 Implementation Status

The 60-template Beta path is implemented and verified. Future agents should
treat the TypeScript mission bank as the current source of truth, not the older
planning assumption that `/grade/1` has only one hardcoded problem.

Implemented surfaces:

- `src/lib/grade1-problems.ts`: mission template contract, islands, deterministic
  renderers, safe fallback mission, and validator helpers.
- `src/lib/grade1-progress.ts`: completed stages, review stages, latest stage,
  today count, parent summary tags, first-start intro dismissal, storage
  recovery, and reset behavior.
- `src/app/grade/1/Grade1GameClient.tsx`: data-driven route, recommended mission,
  selected mission state, retry/hint flow, one-time intro guide, progress
  persistence, reward collection state, and next-path continuation.
- `src/components/grade1/**`: map, stage nodes, mission visual renderers,
  mission card, reward reveal, reward collection, mascot guide, and asset image
  wrapper.
- `scripts/validate-grade1-problems.js`: CI-friendly validation for mission
  template quality.
- `scripts/mission-bank-quality-report.js`: Grade 1/2 mission-bank audit that
  fails on warnings during scale-up.
- `e2e/learning-loop.spec.ts`: route, hint, reward, corrupt storage, and
  reward-to-next-mission flow coverage.

Verification snapshot from the 2026-05-10 UX pass:

- `npm run lint`
- `npm run validate:grade1`
- `npm run test -- src/lib/grade1-progress.test.ts src/lib/grade1-problems.test.ts src/components/grade1/grade1-components.test.ts`
- `npm run build`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`
- `npm run tdd:guard`
- Browser check on `/math_assist/grade/1/` confirmed the reward panel shows
  `다음 미션 풀기`, `다시 풀기`, and `지도 보기` without layout overlap.
- Follow-up browser check confirmed the first-start guide hides after the learner
  begins, `RewardReveal` shows the current reward count, and `보물 가방` updates
  `숫자 조각 보상` from `0개` to `1개`.

## Target Shape

Use "mission template" as the unit of authoring. A template renders many concrete
problems through parameter ranges, but still has one deterministic answer rule.

Recommended milestones:

| Milestone | Mission templates | Coverage | Purpose |
| --- | ---: | --- | --- |
| Alpha | 24 | counting, comparison, add/sub within 10, shapes | Replace single demo with a usable path |
| Beta | 60 | six islands, three difficulty bands, review missions | Enough variety for repeated short sessions |
| V1 | 96 | full Grade 1 adventure route, rewards, retry/review | Stable personal-use product target |

## Adventure Map

Keep the existing "숫자 탐험섬" framing and split work into islands. Each island
owns a narrow skill, a reward family, and a visual model so UI and content agents
can work independently.

| Island | Skill scope | Example missions | Visual model |
| --- | --- | --- | --- |
| Count Cove | 0-9, 10-20, counting objects | "사과가 몇 개일까요?" | counting grid, object row |
| Order Bridge | compare, before/after, sequence | "더 큰 수를 골라요" | number cards, stepping stones |
| Orchard Port | addition within 10/20 | "사과 4개와 3개를 합쳐요" | merge groups |
| River Dock | subtraction within 10/20 | "구슬 8개 중 3개가 떠났어요" | remove objects |
| Shape Forest | circles, triangles, squares, solids | "같은 모양을 찾아요" | shape cards |
| Clock Tower | hour and half-hour, daily order | "긴 바늘이 12에 있어요" | clock face |
| Pattern Cave | repeating and growing patterns | "다음에 올 모양은?" | pattern strip |
| Review Island | mixed review and retry | "틀렸던 미션 다시 보기" | prior mission replay |

## Problem Contract

Prefer a Grade 1-specific contract first instead of forcing the existing Grade 5
template generator to fit visual story problems too early. Keep the contract in a
small library, then move to JSON only after the shape stabilizes.

Suggested initial files:

- `src/lib/grade1-problems.ts`
- `src/lib/grade1-problems.test.ts`
- `scripts/validate-grade1-problems.js`
- `src/components/grade1/*` consumers

Suggested template shape:

```ts
type Grade1Skill =
  | 'counting'
  | 'comparison'
  | 'addition'
  | 'subtraction'
  | 'shape'
  | 'time'
  | 'pattern'
  | 'review'

type Grade1VisualModel =
  | 'counting-grid'
  | 'object-groups'
  | 'number-cards'
  | 'shape-cards'
  | 'clock-face'
  | 'pattern-strip'

interface Grade1MissionTemplate {
  id: string
  islandId: string
  stageOrder: number
  skill: Grade1Skill
  difficulty: 1 | 2 | 3
  learnerGoal: string
  parentSummaryTag: string
  promptTemplate: string
  answerType: 'choice' | 'number'
  paramSchema: Record<string, { min: number; max: number }>
  solverRule: string
  choicesTemplate?: string[]
  visualModel: Grade1VisualModel
  visualConfig: Record<string, string | number | boolean>
  hintStepsTemplate: string[]
  solutionStepsTemplate: string[]
  rewardId: string
}
```

Rules:

- `solverRule` must evaluate deterministically from `paramSchema`.
- Choice templates must have exactly one correct answer and no duplicates.
- The first choice template is the unshuffled correct answer, matching the current
  generator convention.
- Visual data describes the scene; it must not be needed to compute correctness.
- Difficulty 1 is direct recognition, difficulty 2 is one transformation, and
  difficulty 3 is a short story or two-step comparison.
- `learnerGoal` is short enough to show in the stage panel.
- `parentSummaryTag` is stable enough to group progress, for example
  `counting-to-10`, `compare-numbers`, or `addition-within-10`.

## Learner Journey

The intended session is short, concrete, and visually led:

1. Home shows a clear Grade 1 adventure entry.
2. The map opens with one recommended stage and visible next rewards.
3. The learner solves one mission at a time.
4. Correct answers unlock a visible reward and the next path.
5. Incorrect answers open a hint and mark the mission for review without reducing
   a visible score.
6. After 3-5 missions, the learner sees a small "today's treasure" summary.

Target session length is 5-10 minutes. Alpha does not need a full dashboard, but
it should already make the next action obvious after every answer.

## Reward-to-Next UX Rule

After a learner solves a mission, the reward screen must provide a direct forward
action. Do not force the learner to return to the map just to continue.

Current behavior:

- The primary reward action is `다음 미션 풀기`.
- `다음 미션 풀기` chooses the first unlocked incomplete stage, ignoring review
  recommendations for this one forward action.
- `오늘 추천 미션` in the header still prioritizes review missions through
  `firstOpenMission`; this is intentional for now because it is a recommendation
  surface, not the immediate continuation path.
- The reward panel keeps `다시 풀기` and `지도 보기` as secondary actions.

Next UX candidate:

- Review whether `오늘 추천 미션` should also prefer the next path during an
  active same-day play streak, then switch back to review-first after the learner
  leaves and returns later.

## Mistake and Hint Policy

Grade 1 mistakes should feel recoverable. Keep grading binary, but vary the help:

| Attempt state | Learner experience | Data state |
| --- | --- | --- |
| First wrong answer | Show a short text hint and keep the same choices visible | mark current mission as `needsReview` |
| Second wrong answer | Add a stronger visual cue, such as highlighted objects or grouped rows | keep mission active |
| Third wrong answer | Show the answer path and offer "다시 풀기" | store for Review Island |
| Correct after hint | Give the reward, but keep a review recommendation | completed + review recommended |

Do not use "partial credit" wording. The app can say "다시 세어볼까요?" or
"힌트를 보고 다시 해봐요" without exposing a fractional score.

## Grade 1 UX Rules

- One instruction per screen region.
- Problem prompt should usually fit in one short sentence.
- Use numerals for target numbers and bold/large visual grouping for the counted
  objects.
- Avoid long explanatory text inside buttons.
- Choices should stay at least 56px high on tablet and mobile.
- Avoid time pressure, loss streaks, or negative scoring.
- Every unfamiliar icon needs either visible context or an accessible label.
- Animations should respect reduced-motion preferences.

## Progress and Parent Summary

Progress should serve two audiences:

- Learner: what opened, what reward appeared, what to tap next.
- Parent: what was practiced, what went well, what needs another short session.

Recommended localStorage summary fields:

- `completedStageIds`
- `reviewStageIds`
- `latestStageId`
- `todaySolvedCount`
- `skillSummaryByTag`
- `lastPlayedAt`
- `schemaVersion`

The parent-facing summary can stay simple in Alpha:

- today solved count
- strongest island
- review island recommendation
- last completed reward

## Error Handling and Resilience

Grade 1 learners should not see technical failures as dead ends. Prefer local
fallbacks, visible retry paths, and validation failures before runtime.

| Failure area | Expected behavior |
| --- | --- |
| Mission template invalid | Validator fails before merge; runtime never ships knowingly invalid templates |
| Mission generation fails | Fall back to a known safe counting mission and log a developer-facing error |
| Missing selected stage | Return to the first open stage and keep progress intact |
| Corrupt localStorage | Ignore the corrupt value, reset Grade 1 progress only, and keep the page usable |
| localStorage unavailable | Continue the session in memory and show no blocking error to the learner |
| Asset missing or slow | Use existing `Grade1AssetImage` fallback and preserve layout dimensions |
| GitHub Pages base path mismatch | Tests must cover `/math_assist` asset/data paths before deploy |
| Double tap or repeated answer | Treat answer submission idempotently and avoid duplicate rewards |
| Older Grade 1 progress storage | Normalize missing `introDismissedAt` to `null` instead of resetting progress |
| Number input invalid | Keep the answer unsubmitted and show a friendly inline correction |
| E2E/browser unsupported feature | Keep mission content readable without advanced animation |

Error copy should be age-appropriate and action-oriented. Example: "그림을 다시
불러오고 있어요" is better than exposing fetch, JSON, or storage details.

## Parallel Work Split

Agents should keep to these file boundaries unless the shared contract changes.

| Agent lane | Primary files | Deliverable |
| --- | --- | --- |
| Content | `src/lib/grade1-problems.ts`, `src/lib/grade1-problems.test.ts`, later `public/data/grade1/**` | Mission templates and deterministic answer coverage |
| Learning loop | `src/app/grade/1/Grade1GameClient.tsx`, future `src/lib/grade1-progress.ts` | Stage selection, local progress, retry/review flow |
| UI and visuals | `src/components/grade1/**`, `src/app/globals.css`, `public/assets/grade1/**` | Renderers for each visual model and map polish |
| Quality | `scripts/validate-grade1-problems.js`, `src/lib/*grade1*.test.ts`, `e2e/**` | Validation, regression tests, route coverage |

If any lane needs to change `src/lib/types.ts`, `src/lib/problem-generator.ts`, or
the Grade 1 template contract, update `workstreams/_shared/README.md` in the same
change.

## Implementation Sequence

1. Done: extract the current hardcoded apple mission into a Grade 1 problem bank.
2. Done: add 24 Alpha mission templates across the adventure islands.
3. Done: add learner journey states for recommended, open, complete, and review
   stages.
4. Done: replace the static `GameMap` stage list with data-driven stages.
5. Done: add visual renderers by `visualModel`, including counting grid, object
   groups, number cards, shape cards, clock face, and pattern strip.
6. Done: add localStorage progress for unlocked, completed, review, and parent
   summary fields.
7. Done: add runtime fallbacks for generation, storage, missing stage, and
   missing asset cases.
8. Done: add `validate-grade1-problems` and route-level E2E coverage.
9. Done: add one-time first-start guidance and a visible reward collection
   surface.
10. Done: expand to 60 Beta templates.
11. Next: deepen Review Island behavior and parent-facing summary quality.

## Acceptance Gates

Before a Grade 1 scale-up branch is considered mergeable:

- `npm run test`
- `npm run build`
- `npm run test:e2e` when UI routing or progress changes
- Grade 1 validator passes with no duplicate choice sets and no missing rewards
- `/grade/1` still works under the GitHub Pages base path `/math_assist`
- Corrupt or unavailable localStorage does not block solving a mission
- Missing assets and repeated answer taps keep the layout stable
- Wrong-answer hint flow is covered by tests before adding more mission volume

## Non-goals

- Do not add partial credit.
- Do not use AI to decide correctness.
- Do not replace the whole Grade 5 template system during Grade 1 scale-up.
- Do not move all Grade 1 UI out of `src/components/grade1`; add renderers there.
