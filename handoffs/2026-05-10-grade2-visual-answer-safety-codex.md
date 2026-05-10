# 2026-05-10 Grade 2 visual answer safety

## Context

The user tested the Grade 2 mission page and found that the visual for
`52 - 28` already contained `24`. The page was
`/math_assist/grade/2/mission?unitId=g2-1-add-sub`, mission
`g2-1-add-sub-02`.

Root cause: `Grade2MissionVisual` rendered answer-only `visualConfig` fields
directly, especially `result` for `vertical-operation`. The mission card had no
state boundary that told visuals when a final answer was allowed to appear.

## What changed

- Grade 2 visual renderers now receive a reveal state before printing answer-only
  values.
- `vertical-operation`, expanded number cards, multiplication tables, and the
  equivalent-length bar case mask final answers during the first attempt.
- Regression coverage was added in the Grade 2 component tests and E2E flow so
  the subtraction mission `52 - 28` cannot show `24` inside the visual before
  the learner submits.
- Agent-facing guidance was added to `AGENTS.md`, `workstreams/03-ui-and-visuals/README.md`,
  and `docs/grade2-curriculum-implementation-notes.md`.

## Files to read first

1. `progress.md` under `2026-05-10`
2. `src/components/grade2/Grade2MissionCard.tsx`
3. `src/components/grade2/Grade2MissionVisual.tsx`
4. `src/components/grade2/grade2-components.test.ts`
5. `e2e/learning-loop.spec.ts`
6. `AGENTS.md` product constraints

## Verification completed

- `npm run validate:grade2`
- `npm run lint`
- `npm run test`
- `npm run tdd:guard`
- `npm run build`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`
- In-app browser check on local port `3002`:
  - mission id: `g2-1-add-sub-02`
  - before submit: vertical result text was `□`
  - before submit: exact `24` count inside the vertical visual was `0`
  - after submitting `24`: vertical result text was `24`

## Still risky

- Some visuals necessarily show source data that can be counted or read to get
  the answer, such as clocks, rulers, tables, and mark graphs. That is allowed
  when the learner still has to interpret the data.
- The risky pattern is different: fields like `result`, `target`, `product`, or
  equivalent-answer labels are computed answer values and should be masked until
  solved or solution guidance is intentionally shown.

## Next agent checklist

- Before adding a new visual model, decide which displayed values are problem
  data and which are answer-only.
- If a renderer uses answer-only `visualConfig` fields, gate them behind
  `showAnswer`.
- Add a focused renderer test or E2E assertion that the unsolved visual does not
  print the final answer.

## 2026-05-10 follow-up: place-value and target highlight audit

User noticed the first place-value mission showed `3`, `4`, and `2` under the
hundreds/tens/ones blocks before submission. That was redundant scaffolding and
made the answer `342` too easy to copy.

Additional changes:

- `place-value-blocks` now keeps the block groups visible but masks the numeric
  count labels as `□` until the learner solves the mission or the solution path
  opens.
- The two place-value block prompts now refer to the picture instead of printing
  the exact digit counts in the question text.
- Target-specific green highlighting in choice/label visuals is also gated by
  `showAnswer`, so a second wrong attempt can emphasize the visual area without
  pointing at the correct card/category before the solution path opens.
- Table-reading and graph-reading visuals still show their source numbers or
  marks when those values are the actual data the learner is meant to interpret.

New verification:

- `npm run test -- src/components/grade2/grade2-components.test.ts`
- `npm run validate:grade2`
- `npm run test`
- `npm run lint`
- `npm run tdd:guard`
- `npm run build`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e -- --grep "자리값 블록|세로셈 시각화"`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`
- Visual browser check on local port `3122`:
  - mission id: `g2-1-place-value-01`
  - before submit: hundreds/tens/ones count labels were all `□`
  - after submitting `342`: count labels revealed `3`, `4`, `2`
  - screenshots: `grade2-place-value-hidden.png`, `grade2-place-value-revealed.png`

## 2026-05-11 follow-up: length inputs, ruler alignment, classification counts

User found three more confusing Grade 2 missions:

- `g2-1-length-02`: prompt asks for total centimeters, but UI accepted `m` and
  `cm` fields and treated `1m 20cm` as correct.
- `g2-1-length-01`: the ruler bar visually landed past the `8` tick because the
  bar and tick labels used different coordinate calculations.
- `g2-1-classification-01`: the classification table printed the answer count
  `4` directly.

Additional changes:

- Length missions can now choose `answerConfig.unit: 'cm'` or `'m-cm'`.
- `g2-1-length-01` and `g2-1-length-02` use a cm-only input field, while
  equivalent-length missions still use `m` plus `cm`.
- cm-only submissions are graded as strings such as `120cm`, so values over
  `99cm` are accepted in the single cm field.
- The ruler visual now uses one shared coordinate system for tick labels, the
  orange bar, and the end marker, with an explicit endpoint marker at `8cm`.
- Classification-unit tables can render count marks before reveal; the numeric
  count is shown only after the answer is solved or the solution path opens.

New verification:

- `npm run test -- src/components/grade2/grade2-components.test.ts src/lib/grade2-answer-normalizers.test.ts`
- `npm run validate:grade2`
- `npm run test`
- `npm run lint`
- `npm run tdd:guard`
- `npm run build`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e -- --grep "길이와 시간 구조화 입력|분류하기 시각화"`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`
- Visual browser check on local port `3122`:
  - `g2-1-length-01`: cm-only input and marker at `8cm`
  - `g2-1-length-02`: cm-only input for `120cm`
  - `g2-1-classification-01`: count marks instead of printed `4`
  - screenshots: `grade2-ruler-cm-input-fixed.png`,
    `grade2-length-conversion-cm-input-fixed.png`,
    `grade2-classification-marks-fixed.png`
