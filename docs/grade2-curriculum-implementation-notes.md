# Grade 2 Curriculum Implementation Notes

Date: 2026-05-10
Owner lane: `workstreams/_shared`

## Purpose

This note captures the Grade 2 investigation completed after the Grade 1
adventure Alpha. It is meant to help the next session decide how to plan and
split Grade 2 implementation work without rediscovering the same curriculum and
architecture constraints.

The short conclusion: Grade 2 should reuse the Grade 1 adventure loop, but it
should not copy the Grade 1 mission contract unchanged. The harder part is not
the number of templates; it is the new visual models and answer normalization
required by place value, vertical addition/subtraction, multiplication, length,
time, classification, and simple graphs.

## Source Baseline

Use the 2022 revised Korean mathematics curriculum as the source of truth.

- Official notice: Ministry of Education notice 2022-33, published
  2022-12-22.
- The notice states that the mathematics curriculum is in `별책 8`.
- The same notice states that the 2022 revised curriculum applies to elementary
  Grade 1 and Grade 2 from 2024-03-01.
- Useful source links:
  - Ministry of Education notice:
    https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&m=040401
  - NCIC curriculum center:
    https://www.ncic.re.kr/
  - Grade/semester achievement-standard mapping used for cross-checking:
    https://www.goe.go.kr/resource/goe/na/bbs_2675/2025/07/f4c15fac-ae7b-46aa-8e16-b8d86b710d44.pdf

Important curriculum shape:

- The official achievement standards are written for the `1-2학년군`, not as a
  separate Grade 2-only list.
- For product planning, use the Grade 2 textbook-style semester units to decide
  sequencing, while keeping every mission traceable to the official
  `[2수..]` achievement standard.

## Grade 2 Scope Map

The Grade 2 area should cover the following unit-level scope.

| Semester | Unit | Main achievement-standard links | Product meaning |
| --- | --- | --- | --- |
| 2-1 | 세 자리 수 | `[2수01-02]`, `[2수01-03]` | Read, write, order, and compare three-digit numbers using place value. |
| 2-1 | 여러 가지 도형 | `[2수03-01]` to `[2수03-05]` | Recognize solid and plane shapes; describe stack positions and directions. |
| 2-1 | 덧셈과 뺄셈 | `[2수01-05]` to `[2수01-09]` | Add/subtract within two-digit ranges, including carrying/borrowing and box values. |
| 2-1 | 길이 재기 | `[2수03-06]`, `[2수03-10]`, `[2수03-12]` | Measure and estimate with cm and m; compare lengths. |
| 2-1 | 분류하기 | `[2수04-01]` | Sort familiar objects by a clear criterion and count the results. |
| 2-1 | 곱셈 | `[2수01-10]` | Understand multiplication through equal groups, arrays, and repeated addition. |
| 2-2 | 네 자리 수 | `[2수01-02]`, `[2수01-03]` | Extend place value to thousands and compare four-digit numbers. |
| 2-2 | 곱셈구구 | `[2수01-11]` | Practice multiplication facts as deterministic one-digit multiplication. |
| 2-2 | 길이 재기 | `[2수03-10]` to `[2수03-13]` | Convert between m/cm and solve length addition/subtraction situations. |
| 2-2 | 시각과 시간 | `[2수03-07]` to `[2수03-09]` | Read clocks to the minute and reason about minute/hour/day/week/month/year relationships. |
| 2-2 | 표와 그래프 | `[2수04-02]`, `[2수04-03]` | Represent classified data in tables and simple mark graphs. |
| 2-2 | 규칙 찾기 | `[2수02-01]`, `[2수02-02]` | Find and extend repeated or increasing patterns in objects, numbers, and multiplication tables. |

## Current Grade 1 Architecture

The current Grade 1 adventure is not built through the older Grade 5
`public/data` practice flow. It is a separate game mode with a TypeScript mission
bank.

Current source-of-truth files:

- `src/lib/grade1-problems.ts`
  - mission template contract
  - islands
  - deterministic rendering
  - safe fallback mission
  - validator helpers
- `src/components/grade1/Grade1MissionVisual.tsx`
  - visual renderers for `counting-grid`, `object-groups`, `number-cards`,
    `shape-cards`, `clock-face`, and `pattern-strip`
- `src/app/grade/1/Grade1GameClient.tsx`
  - selected mission state
  - wrong-answer hint flow
  - reward-to-next progression
  - local progress persistence
- `src/lib/grade1-progress.ts`
  - localStorage schema
  - completed stages
  - review stages
  - today count
  - parent summary tags
- `scripts/validate-grade1-problems.js`
  - validation command: `npm run validate:grade1`

Verification from the investigation:

- `npm run validate:grade1` passed with 24 Grade 1 templates.
- Focused Grade 1 tests passed:
  `npm run test -- src/lib/grade1-problems.test.ts src/lib/grade1-progress.test.ts src/components/grade1/grade1-components.test.ts`

## What Grade 2 Can Reuse

Reuse these parts directly or with light extraction:

- Deterministic mission rendering: parameter ranges, template rendering,
  shuffled choices, single correct answer.
- The one-mission-at-a-time learner flow.
- Binary grading only: correct or incorrect; no partial credit language.
- Wrong-answer policy: show hint, keep the mission active, mark for review.
- Reward reveal and direct `다음 미션 풀기` continuation.
- LocalStorage progress pattern, including corrupt-storage recovery.
- Parent-facing summary tags.
- Existing Grade 1 visual models for:
  - basic object groups
  - number cards
  - simple plane shape cards
  - clock face, after extension to arbitrary minutes
  - pattern strips

The best implementation style is to copy the Grade 1 shape once for Grade 2
Alpha, then extract shared components only after duplication becomes concrete.
Prematurely generalizing all Grade 1 names into a cross-grade framework will
create unnecessary merge risk.

## Required Grade 2 Extensions

The Grade 1 contract is too narrow in three places: skills, visuals, and answer
types.

Recommended Grade 2 skills:

```ts
type Grade2Skill =
  | 'place-value'
  | 'number-comparison'
  | 'addition-subtraction'
  | 'multiplication-meaning'
  | 'multiplication-facts'
  | 'solid-shapes'
  | 'plane-shapes'
  | 'length'
  | 'time'
  | 'classification'
  | 'table-graph'
  | 'pattern'
```

Recommended new visual models:

```ts
type Grade2VisualModel =
  | 'place-value-blocks'
  | 'expanded-number-cards'
  | 'vertical-operation'
  | 'box-equation'
  | 'array-groups'
  | 'multiplication-table'
  | 'solid-shape-cards'
  | 'stack-cubes'
  | 'ruler-line'
  | 'length-bars'
  | 'clock-face'
  | 'calendar-strip'
  | 'classification-table'
  | 'mark-graph'
  | 'pattern-strip'
```

Recommended answer-type expansion:

```ts
type Grade2AnswerType =
  | 'choice'
  | 'integer'
  | 'length'
  | 'time'
  | 'label'
```

Why this matters:

- The current Grade 1 game only accepts digits for number answers in
  `Grade1GameClient`. Grade 2 needs answers such as `1m 20cm`, `120cm`,
  `3시 25분`, and sometimes Korean labels.
- The existing shared `grader.ts` normalizes integers, decimals, fractions, and
  mixed numbers for the older practice flow. It does not normalize elementary
  unit answers or time answers.
- Length and time should be normalized to canonical internal values, such as
  centimeters and minutes since midnight, before comparison.

## Structural Risks

1. Place value is deceptively visual.

Three- and four-digit numbers need hundreds/tens/ones or
thousands/hundreds/tens/ones blocks. Simple number cards are enough for some
comparison questions, but not enough for teaching positional notation.

2. Addition/subtraction needs operation layout support.

Grade 1 object groups can show simple add/subtract scenes. Grade 2 needs column
alignment, carrying/borrowing indicators, and box-value equations. Avoid
rendering all of this as plain text.

3. Measurement answers are not plain integers.

Problems can ask for `몇 cm`, `몇 m 몇 cm`, or a comparison between lengths. The
mission system must know which unit is expected and what equivalents are
accepted.

4. Time has two different meanings.

Clock reading is one thing; elapsed time and calendar relationships are another.
The visual model and normalizer should keep `time-of-day` and `duration`
separate.

5. Classification and graph problems need data integrity checks.

Tables and mark graphs can easily become invalid if category counts do not match
the displayed objects. The validator should check category totals and one
correct answer across seeds.

6. The Grade 1 route and component names are grade-specific.

It is safe to create `grade2` files first. Extracting generic names should be a
later refactor, after Grade 2 Alpha proves which surfaces are truly common.

## Recommended Grade 2 Alpha

Build a small but complete Alpha before scaling template count.

Suggested Alpha target:

- Route: `/grade/2`
- Mission templates: 36
- Coverage: 12 Grade 2 units x 3 missions each
- Visual models in Alpha:
  - `place-value-blocks`
  - `vertical-operation`
  - `array-groups`
  - `ruler-line`
  - `clock-face`
  - `classification-table`
  - `mark-graph`
  - reuse `number-cards`, `shape-cards`, `pattern-strip` where sufficient
- Validation command: `npm run validate:grade2`
- Focused tests:
  - mission bank validation
  - length/time normalizers
  - at least one renderer test for each new visual model
  - E2E smoke for `/math_assist/grade/2/`

Suggested files:

- `src/lib/grade2-problems.ts`
- `src/lib/grade2-problems.test.ts`
- `src/lib/grade2-answer-normalizers.ts`
- `src/lib/grade2-answer-normalizers.test.ts`
- `src/lib/grade2-progress.ts`
- `src/components/grade2/Grade2MissionVisual.tsx`
- `src/components/grade2/MissionProblemCard.tsx`
- `src/app/grade/2/page.tsx`
- `src/app/grade/2/Grade2GameClient.tsx`
- `scripts/validate-grade2-problems.js`
- `docs/grade2-curriculum-implementation-notes.md`
- `handoffs/YYYY-MM-DD-grade2-*.md`

## Workstream Guidance

Use these boundaries to reduce conflicts:

- `workstreams/01-content-and-curriculum`
  - owns Grade 2 scope mapping, mission templates, answer rules, and validators
- `workstreams/02-learning-loop`
  - owns progress persistence, retry/review behavior, and answer submission
- `workstreams/03-ui-and-visuals`
  - owns new Grade 2 renderers, route shell, map theme, assets, and browser checks
- `workstreams/04-quality-and-automation`
  - owns validation scripts, E2E coverage, and problem-quality audit updates
- `workstreams/_shared`
  - owns any cross-grade contract extraction or changes to high-conflict files

Avoid editing these in the first Grade 2 planning step unless the plan explicitly
needs them:

- `src/lib/types.ts`
- `src/lib/problem-generator.ts`
- `public/data/concepts.json`
- `public/data/templates/*.json`

Those files belong to the older 5th-grade practice flow and are shared hotspots.
Grade 2 Alpha can be implemented without touching them.

## Next Planning Questions

The next session should answer these before coding:

1. Should Grade 2 keep the same island/adventure metaphor, or use a new
   Grade 2 theme while reusing the same mechanics?
2. Which 36 Alpha missions should represent the 12 units?
3. Which unit-answer forms are accepted for length and time?
4. Which visual models must exist in Alpha, and which can wait for Beta?
5. Should Grade 2 progress share a cross-grade storage namespace or keep a
   separate `mathAssist_grade2Progress` key?
6. What is the minimum E2E path that proves the new unit types without making the
   first implementation too large?

