# 2026-05-11 Grade 2 continuity handoff

## Current State

- Product-fix commit summarized by this handoff:
  `248a7c9 Fix grade 2 visual answer leakage`.
- `main` was pushed to `origin/main`.
- GitHub Pages workflow `Deploy Next.js site to Pages` completed successfully
  for that product-fix commit before this documentation update.
- Public route to sanity-check after Pages propagation:
  `https://outliner-coach.github.io/math_assist/grade/2/`.
- Local route used during verification:
  `http://localhost:3122/math_assist/grade/2/mission?unitId=g2-1-place-value`.

## Read This First

1. `AGENTS.md`
   - Product constraints and TDD gate.
   - The important current rule: visuals can show problem data, but not
     answer-only values before submit or solution reveal.
2. `handoffs/2026-05-10-grade2-visual-answer-safety-codex.md`
   - Long-form issue history for the visual answer leakage fixes.
3. `src/components/grade2/Grade2MissionCard.tsx`
   - Owns answer input rendering and the `showAnswer` reveal boundary.
4. `src/components/grade2/Grade2MissionVisual.tsx`
   - Owns all Grade 2 visual renderers and masking behavior.
5. `src/lib/grade2-problems.ts`
   - Source of truth for Grade 2 mission templates and visual config.
6. `src/components/grade2/grade2-components.test.ts`
   - Renderer-level regression coverage.
7. `e2e/learning-loop.spec.ts`
   - Browser-level Grade 2 learning-loop coverage.

## What Was Fixed

The work started from a learner-facing bug: answer values were visible in the
problem visual before the learner answered. It expanded into a broader Grade 2
visual-safety pass.

Fixed cases:

- `g2-1-add-sub-02`: vertical subtraction no longer shows `24` before reveal.
- `g2-1-place-value-01`: place-value count labels no longer show `3`, `4`,
  `2` before reveal.
- `g2-1-place-value-03` and `g2-2-place-value-03`: expanded-form targets are
  masked before reveal.
- `g2-2-facts-01`: multiplication products are masked before reveal.
- `g2-2-length-03`: equivalent-answer label `1m 20cm` is masked before reveal.
- Choice/label visual highlighting no longer points to the correct target on
  wrong attempts before the solution path opens.
- `g2-1-length-01`: ruler marker now aligns exactly to the `8cm` tick.
- `g2-1-length-01` and `g2-1-length-02`: prompts asking for cm now show a
  cm-only input, not an `m` plus `cm` input.
- `g2-1-classification-*`: classification tables can show count marks instead
  of printed numbers before reveal.

## Current Contracts

### Reveal Contract

`Grade2MissionCard` computes:

- `showSolutionPath = wrongAttemptCount >= 3 && !solved`
- `revealVisualAnswer = solved || showSolutionPath`

It passes `showAnswer={revealVisualAnswer}` to `Grade2MissionVisual`.

Renderer rule:

- Problem data can render before answer submission when the learner must inspect
  or count it.
- Answer-only values must wait for `showAnswer`.
- Examples of answer-only values: `result`, `target`, `product`,
  equivalent-answer labels, direct digit/count labels that can be copied as the
  answer.

### Length Input Contract

`Grade2AnswerConfig.unit` controls the input shape:

- `unit: 'cm'`: one `cm` field only. Submitted to grading as a string like
  `120cm` so values over `99cm` are allowed.
- `unit: 'm-cm'`: structured `m` plus `cm` fields. The `cm` part must be under
  `100`.

Use `unit: 'cm'` when the prompt asks "몇 cm". Use `unit: 'm-cm'` when the
prompt asks for an answer in meters and centimeters.

### Classification Visual Contract

`classification-table` can use:

- `countDisplay: 'marks'`: show count marks before reveal and numeric counts
  after reveal.
- no `countDisplay`: show numeric table values. This remains appropriate for
  table-reading and graph-reading missions where the number is the source data.

## Verification Already Completed

For the latest pushed state, the following passed:

- `npm run validate:grade2`
- `npm run test`
- `npm run lint`
- `npm run tdd:guard`
- `npm run build`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`

Full E2E result after the last fix: `12 passed`.

Focused E2E coverage now includes:

- `2학년 게임 모드에서 길이와 시간 구조화 입력을 사용한다`
- `2학년 분류하기 시각화는 풀이 전 개수 숫자를 표식으로 보여준다`
- `2학년 자리값 블록 시각화는 풀이 전 자리 숫자 라벨을 숨긴다`
- `2학년 세로셈 시각화는 풀이 전 정답을 숨긴다`

## Browser QA Notes

Manual browser checks were done on local port `3122`.

Verified screens:

- `/grade/2/mission?unitId=g2-1-length`
  - mission 1 shows a cm-only input and an endpoint marker at `8cm`.
  - mission 2 shows a cm-only input for `120cm`.
- `/grade/2/mission?unitId=g2-1-classification`
  - mission 1 shows blue count marks instead of printed `4`.
- `/grade/2/mission?unitId=g2-1-place-value`
  - mission 1 hides place-value digit labels as `□` before submit.

Screenshot files from browser QA were local verification artifacts and were not
committed.

## Known Non-Issues

- A `favicon.ico` 404 appeared during local browser checks. It is unrelated to
  Grade 2 behavior.
- GitHub Actions emitted a Node.js 20 deprecation annotation for some actions.
  The Pages deployment still succeeded. This is a future workflow maintenance
  item, not a product regression.

## How To Continue Safely

- Before changing a Grade 2 visual, decide whether each visible value is
  problem data or answer-only data.
- If new visual config fields can reveal the answer, add a `showAnswer` gate and
  a focused renderer or E2E regression test in the same change.
- Run `npm run validate:grade2` early after editing `src/lib/grade2-problems.ts`.
- Use `PLAYWRIGHT_PORT=3111 npm run test:e2e` for the full browser flow. If
  sandboxing blocks local port binding, rerun with approved escalation.
- For visual QA, start the server with `npm run dev -- -p 3122` and inspect the
  relevant `/math_assist/grade/2/mission?unitId=...` route.

## Suggested Next Work

- Do a learner-pass through the remaining Grade 2 units and classify findings as
  either "answer leakage", "ambiguous visual", "input mismatch", or "content
  correctness".
- Consider a small automated visual-safety audit that renders every Grade 2
  mission unsolved and searches for direct `correctAnswer` text inside the visual
  region, while allowing explicitly whitelisted source-data cases.
- Review GitHub Pages workflow maintenance for the Node.js action deprecation
  annotation before June 2026.
