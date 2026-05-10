# Grade 2 Lessons Learned

Date: 2026-05-11
Owner lane: `workstreams/_shared`

## Purpose

This note collects the Grade 2 lessons learned across planning, Alpha
implementation, visual-safety fixes, learner-facing QA, and the classification
visual polish. Use it before extending Grade 2 missions, renderers, inputs, or
tests.

The goal is not to freeze the design. The goal is to prevent the same mistakes:
answer leakage inside visuals, input shapes that do not match the prompt,
ambiguous visual data, skipped browser checks, and Alpha scope being mistaken for
full-course coverage.

## Read First

1. `AGENTS.md`
2. `docs/grade2-curriculum-implementation-notes.md`
3. `docs/grade2-lessons-learned.md`
4. `handoffs/2026-05-10-grade2-visual-answer-safety-codex.md`
5. `handoffs/2026-05-11-grade2-continuity-codex.md`
6. `handoffs/2026-05-11-grade1-grade2-beta-scaleup-codex.md`
7. `src/lib/grade2-problems.ts`
8. `src/lib/grade2-answer-normalizers.ts`
9. `src/components/grade2/Grade2MissionCard.tsx`
10. `src/components/grade2/Grade2MissionVisual.tsx`
11. `src/components/grade2/grade2-components.test.ts`
12. `e2e/learning-loop.spec.ts`

## Product Lessons

### Beta Expands Volume, Not Screen Complexity

The Grade 2 Beta bank has 72 missions: 12 units x 6 missions. The product flow
should still stay unit-first and one-mission-focused. Do not make the first
screen a dense full-course mission list just because each unit now has more
missions.

The 2026-05-11 Beta closeout verified:

- unit cards and mission nodes show 6 missions per unit
- mission card progress uses dynamic `unitMissionOrder/missionCount`
- `진행 초기화` requires a second click before clearing local progress
- desktop, tablet, and mobile browser checks do not show visible overlap in the
  checked Grade 2 flows
- vertical-operation results remain hidden before submission and reveal only
  after success

### Keep Alpha Separate From Mastery

The 36-mission Grade 2 Alpha is a representative validation slice:
12 units x 3 missions. It proves the loop, contracts, visual models, validators,
and QA process. It is not full Grade 2 mastery coverage.

When extending content, state whether the work is:

- Alpha contract validation
- additional representative coverage
- full unit coverage
- mastery/repetition coverage

Do not claim full-course sufficiency from the Alpha mission count.

### Preserve The Unit-First Flow

Grade 2 should remain unit-first. The learner chooses a unit, then sees that
unit's missions. Do not replace the first screen with a dense full-course
mission list unless the product direction explicitly changes.

For child-facing work:

- keep one mission as the primary focus
- use large touch targets
- avoid free-form unit text when structured input is clearer
- check mobile/tablet flow, not only desktop

### Deterministic Grading Stays Non-Negotiable

Answer calculation and grading must remain deterministic and rule-based. AI may
help with hints or feedback later, but Grade 2 correctness should not depend on
AI output.

Grading remains binary: correct or incorrect. Do not introduce partial credit
language or scoring without an explicit product requirement.

## Contract Lessons

### Separate Problem Data From Answer-Only Data

This is the most important Grade 2 visual rule.

Problem data can render before submission when the learner must inspect it:

- clock hands
- ruler ticks and measured spans
- visible groups to count
- table or graph source values when the task is to read the table or graph
- count marks when the task is to count marks

Answer-only data must be hidden until `showAnswer` is true:

- `visualConfig.result`
- `visualConfig.target` when it points to the correct card or label
- `visualConfig.product`
- equivalent-answer labels such as `1m 20cm`
- direct digit or count labels that can be copied as the final answer

`Grade2MissionCard` owns the reveal boundary:

```ts
showSolutionPath = wrongAttemptCount >= 3 && !solved
revealVisualAnswer = solved || showSolutionPath
```

`Grade2MissionVisual` must receive and obey `showAnswer`.

### Add Tests With Every Renderer Risk

If a visual uses answer-only fields, add a focused regression test in the same
change. Good tests check both states:

- unsolved visual does not print or highlight the answer
- solved or solution-path visual reveals the intended answer

Use renderer tests for precise HTML expectations and E2E tests for the browser
flow. The TDD gate expects production changes under `src/**` or `public/data/**`
to include focused test changes.

### Keep Length Inputs Aligned With The Prompt

`Grade2AnswerConfig.unit` controls the input shape:

- `unit: 'cm'`: one centimeter field only. Use this when the prompt asks
  "몇 cm".
- `unit: 'm-cm'`: structured meters plus centimeters fields. Use this when the
  prompt asks for "몇 m 몇 cm".

Do not show `m` plus `cm` fields for a prompt that asks for total centimeters.
For cm-only answers, submit strings such as `120cm` so values over `99cm` are
valid.

### Keep Time-Of-Day And Duration Separate

Clock reading and elapsed duration both use hours and minutes, but they are not
the same answer type.

- `time-of-day`: a clock time, such as `3시 25분`
- `duration`: elapsed time, such as `35분` or `1시간 20분`

Do not reuse one normalizer path if it blurs those meanings.

### Validate Mission Data Early

Run `npm run validate:grade2` early after editing `src/lib/grade2-problems.ts`.
It catches template shape mistakes before they become UI bugs.

The validator should remain strict about:

- 72 Beta templates until the target scope changes
- 12 units with 6 missions each
- two `easy`, two `medium`, and two `applied` missions per unit
- unique ids and mission orders
- curriculum code traceability
- answer config matching answer type
- visual config integrity
- classification and graph count consistency
- clock and ruler bounds
- safe fallback mission availability

## Visual Lessons

### Place Value Is Not Just Number Cards

Place-value missions need block models and masked count labels. Showing the
hundreds/tens/ones counts as numbers before submission lets the learner copy the
answer instead of reading the model.

Keep the model visible, but mask direct numeric labels as `□` until `showAnswer`.

### Column Operations Need Result Masking

Vertical addition/subtraction visuals can keep the operation layout visible, but
must not print the result row before reveal.

This bug already happened with `52 - 28 = 24`. Do not reintroduce it.

### Classification Tables Need The Right Display Mode

Classification visuals have two legitimate modes:

- `countDisplay: 'marks'`: show marks before reveal, numeric counts after reveal.
- no `countDisplay`: show numbers when the numbers are source data for table or
  graph reading.

For early classification questions such as "빨간 물건은 모두 몇 개", marks are
better than printing the answer count. Use color-coded rows and marks when the
category names are colors or familiar object groups.

The latest classification visual polish maps labels and marks to category
themes, for example:

- `빨강`: red label and red marks
- `파랑`: blue label and blue marks
- `노랑`: yellow label and yellow marks

This improves scanability, but it does not replace the answer-safety rule:
numeric counts still wait for reveal when `countDisplay: 'marks'`.

### Visual QA Must Include Breakpoints

Do not trust one desktop screenshot. For learner-facing visual changes, check at
least:

- desktop, around `1280x720`
- tablet, around `834x1112`
- mobile, around `390x844`

Look for:

- labels and marks not overlapping
- visual data staying inside its panel
- input area still reachable
- text wrapping without clipping
- solved state still readable

If an existing dev server shows unstyled HTML or stale output, start a fresh
server on a new port and verify again before judging the UI.

## Verification Lessons

Use this sequence for substantial Grade 2 changes:

```bash
npm run validate:grade2
npm run test
npm run lint
npm run build
PLAYWRIGHT_PORT=3111 npm run test:e2e
npm run tdd:guard
```

For narrower visual changes, at minimum run the focused renderer tests, the
relevant E2E grep, lint, build, and `tdd:guard`.

Known local issues:

- port `3100` may already be in use
- sandboxed port binding can fail with `EPERM`; rerun the same E2E command with
  proper approval
- existing dev servers can serve stale or broken styling; use a fresh port for
  visual QA when screenshots look suspicious

Before committing:

- check `git status --short --branch`
- avoid committing generated `output/` artifacts
- avoid staging embedded repo or gitlink noise such as `harness_framework`
- make sure production changes and test changes travel together

## Extension Checklist

Before adding or changing a Grade 2 mission:

- Identify the workstream and stay inside its boundary where possible.
- Decide whether the work is Alpha, coverage expansion, or mastery expansion.
- Keep the mission traceable to a `[2수..]` curriculum code.
- Decide the answer type and input shape before writing UI.
- For every visual field, classify it as problem data or answer-only data.
- Gate answer-only data behind `showAnswer`.
- Run `npm run validate:grade2` after mission-bank edits.
- Add or update focused tests in the same change.
- Browser-check the actual route at desktop, tablet, and mobile widths.
- Leave a dated handoff if the change affects future agents.
