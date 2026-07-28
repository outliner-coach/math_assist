# T10 report — 세 학년 내부 검수 화면

## RED evidence

- `npx vitest run src/lib/problem-review.test.ts`
  - failed first because `getApplicationProblemReviewData` did not exist.
  - the failing tests required 9 registered Grade 2/5/6 family rows, row-derived
    filter dimensions, generated answer/solution/hint/misconception/check data,
    and distinct pre-submit/post-answer quantitative visual review states.
- `npx playwright test e2e/problem-review.spec.ts --project=chromium --workers=1`
  - failed before the route update because the old page still imported
    `getProblemReviewData`, which no longer existed after the data-contract RED step.

## Implemented

- Replaced the former Grade 5 template sample data with the nine registered
  application-family runtimes from `APPLICATION_PROBLEM_REGISTRY_V1`.
- Each review row generates a deterministic representative instance, preserves
  the registered prompt/answer/choices/solution/hints, maps declared
  misconceptions from the matching knowledge pack, resolves the generated
  visual through `resolveApplicationVisual`, and exposes the registered proof
  authority id/mode/expected count as automatic-check evidence.
- Rebuilt `/review/problems` as a read-only internal review page with row-derived
  filters for grade, unit, family, version, cognitive domain, reasoning pattern,
  standard, proof mode, and release status. It has no learner-route links,
  approval action, storage action, or runtime AI call.
- Quantitative visuals explicitly show the same resolved scene in hidden-answer
  and revealed-answer review states.

## GREEN / verification

- `npx vitest run src/lib/problem-review.test.ts` — 4 passed.
- `npx playwright test e2e/problem-review.spec.ts --project=chromium --workers=1` — 3 passed.
  - includes 390×844 and 1024×768 checks for horizontal overflow and filter target height.
- `npm run lint` — passed.
- `npm run tdd:guard` — passed; recognized the corresponding lib and browser tests.
- `git diff --check` — passed.

## Changed files

- `src/lib/problem-review.ts`
- `src/lib/problem-review.test.ts`
- `src/app/review/problems/ProblemReviewClient.tsx`
- `src/app/review/problems/page.tsx`
- `e2e/problem-review.spec.ts`

## Remaining concern

- All reviewed families remain their registered `draft` / pending approval state.
  This task displays that state only; it does not perform the T11 approval or
  release transition.

## Fix round 1 — shared executed evidence

### RED evidence

- `npx vitest run src/lib/application-problems/quality-evidence.test.ts src/lib/problem-review.test.ts src/components/ApplicationProblemVisual.test.ts`
  - failed because the shared quality-evidence module did not exist and review
    rows exposed neither `proof.proven` nor an audit status.
  - the failing fixture required a failed proof with `oracle disagreed` to be
    represented as `failed`, rather than as a proof-authority success.

### Change

- Added `src/lib/application-problems/quality-evidence.ts` as the one read-only
  production evidence computation. It executes the registered Grade 2/5/6 proof
  domains, computes deterministic sample/oracle/visual/answer-exposure evidence,
  and emits one `familyId@version` row with real proof outcome, checked count,
  proof issues, and pass/fail audit-ready status.
- `scripts/application-problem-quality-core.js` now loads that shared output for
  T9 audit input and consumes its per-family proof result; its former duplicate
  proof/answer-exposure helpers were removed. Existing APQ error codes remain
  unchanged.
- `/review/problems` consumes the same production output and shows `증명 실행`
  pass/fail, actual checked/expected counts, proof issues, and audit outcome.
- Added an actual Grade 5 quantitative representative render check: an
  answer-only label is absent before reveal and present after reveal.
- Replaced new Set iterator spreads in T10 files with `Array.from`.

### Verification

- Focused Vitest: 35 passed across quality evidence, review, visual, and audit tests.
- `npm run validate:application-packs` — 9 families, 0 errors.
- `npm run audit:applications` — 0 errors.
- `npx playwright test e2e/problem-review.spec.ts --project=chromium --workers=1` — 3 passed.
- `npm run lint`, `npm run tdd:guard`, and `git diff --check` — passed.
- `npx tsc --noEmit` still exits nonzero only for unrelated existing diagnostics:
  `src/components/grade2/grade2-components.test.ts:16`,
  `src/components/grade2/Grade2ApplicationLengthVisual.test.ts:126`,
  `src/components/grade3/grade3-components.test.ts:54`,
  `src/components/grade4/grade4-components.test.ts:15`, multiple
  `src/components/ScratchPad.persistence.test.ts` diagnostics,
  `src/lib/application-problems/visual-model.test.ts:95,153`,
  `src/lib/curriculum-allocation.test.ts:49,66,154,169,183,189`,
  `src/lib/grade4-problems.test.ts:56`, `src/lib/grade6-study.test.ts:42-44`,
  and `src/lib/server/remote-auth-core.test.ts:67`. No diagnostics remain in
  T10-modified/new files.
