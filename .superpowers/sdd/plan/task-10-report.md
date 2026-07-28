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
