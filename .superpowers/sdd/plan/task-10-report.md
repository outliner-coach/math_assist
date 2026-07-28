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

## Fix round 2 — compact overlap SVG label scale

### RED evidence

- Added a representative-render assertion for an explicit SVG `font-size` and
  label marker on `g5-area-overlap-reconstruction`.
- `npx vitest run src/components/ApplicationProblemVisual.test.ts` failed first:
  the pre-change SVG had no scene-relative label size or label marker, so its
  browser default of `14` viewBox units scaled into the small `18.4102`-unit
  overlap scene.

### Change

- `ApplicationProblemVisual` now derives a bounded label size from each
  diagram's viewBox. Compact diagrams use at most `1` viewBox unit.
- For compact diagrams only, labels move to an added, scene-relative callout
  region directly below the unchanged mathematical drawing. The original
  primitive coordinates, visible-before/revealed-after content selection, and
  answer disclosure rules are unchanged.
- The review browser test measures all marked label and primitive `getBBox()`
  values at 390×844 and 1024×768. It requires positive bounded label sizes,
  viewBox containment, less than 20% label-to-label overlap, and less than 20%
  label-to-diagram coverage.

### Actual-card visual evidence

- Captured the Grade 5 overlap review card in Chromium at 390×844 and
  1024×768. The before-answer SVG viewBox is `18.4102 × 22.4610`; all six
  labels are `0.921` scene units (under 12% of viewBox width).
- At 390px the SVG renders `232 × 283.05` CSS px; label bounds are within
  `x=5.649..12.761`, `y=13.479..22.184`. At 1024px it renders
  `330 × 402.61` CSS px; bounds are within `x=5.648..12.762`,
  `y=13.459..22.169`.
- Both viewports measured `maximumLabelOverlap=0` and
  `maximumDiagramCover=0`; visual inspection confirmed the text is legible
  below, rather than across, the three-shape diagram in both pre-answer and
  revealed-answer cards.

### Verification

- `npx vitest run src/components/ApplicationProblemVisual.test.ts src/lib/problem-review.test.ts src/lib/application-problem-quality-audit.test.ts src/lib/application-problems/quality-evidence.test.ts` — 36 passed.
- `npx playwright test e2e/problem-review.spec.ts --project=chromium --workers=1` — 4 passed, including the two viewport geometry checks.
- `npm run validate:application-packs` — 9 families, 0 errors.
- `npm run audit:applications` — 0 errors.
- `npm run lint`, `npm run tdd:guard`, and `git diff --check` — passed.

## Fix round 3 — all diagram label readability

### RED evidence

- Replaced the overlap-only browser assertion with all seven registered diagram
  families (three Grade 2, three Grade 5, and one Grade 6) in both
  pre-answer/revealed-answer states at 390×844 and 1024×768.
- Before the font adjustment, Chromium measured the first Grade 2 label at
  `7.73px` CSS-equivalent against the new `10px` minimum. The first RED run
  failed at that assertion.
- After the initial size increase, the browser found a full cover ratio for
  the Grade 6 part-whole label that is intentionally centered in its modeled
  bar segment. The test was made precise: only labels explicitly associated
  with a diagram primitive may occupy that primitive; every other label keeps
  the no-severe-cover (`< 0.2`) rule. This revised test remained RED until the
  renderer emitted the non-sensitive targeted-label marker.

### Change

- The compact callout path now requires *both* viewBox dimensions to be at
  most `32`, so ordinary narrow or short diagrams do not accidentally gain a
  callout region.
- Compact scenes use `1..1.4` scene units. Non-compact diagrams use a bounded
  `13..20` scene-unit label size derived from viewBox width; this restores
  readable Grade 2 and Grade 6 text without changing primitive coordinates,
  areas, topology, or answer disclosure.
- The browser test now checks all registered diagram states for CSS-equivalent
  font size (>=10px), actual text-box height (>=12px), viewBox containment,
  label overlap (<0.2), and non-targeted diagram cover (<0.2). Before states
  exclude answer-emphasis primitives; revealed states contain no standalone
  `?` label.

### Actual Chromium metrics

All ranges include every diagram label and both before/after states.

| Viewport | Grade | CSS font range | Text bbox-height range |
| --- | --- | --- | --- |
| 390×844 | 2 | 12.89–13.17px | 15–16px |
| 390×844 | 5 | 11.60–13.65px | 14–16px |
| 390×844 | 6 | 12.89px | 15px |
| 1024×768 | 2 | 18.33–18.73px | 21–23px |
| 1024×768 | 5 | 16.50–19.41px | 20–23px |
| 1024×768 | 6 | 18.33px | 21px |

### Verification

- `npx vitest run src/components/ApplicationProblemVisual.test.ts src/lib/problem-review.test.ts src/lib/application-problem-quality-audit.test.ts src/lib/application-problems/quality-evidence.test.ts` — 36 passed.
- `npx playwright test e2e/problem-review.spec.ts --project=chromium --workers=1` — 4 passed.
- `npm run validate:application-packs` — 9 families, 0 errors.
- `npm run audit:applications` — 0 errors.
- `npm run lint`, `npm run tdd:guard`, and `git diff --check` — passed.
