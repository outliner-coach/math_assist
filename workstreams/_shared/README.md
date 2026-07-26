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

- 2026-07-26: Grade 3 capacity-and-weight completion (primary workstreams 01,
  03, and 04) owns the narrow expansion of `g3-2-capacity-weight` from three
  to seven stable-ID missions, its seven curriculum references, and the
  quantitative capacity-operation, weight-operation, and tonne renderers.
  Given liters/milliliters, kilograms/grams, operators, and tonne blocks must
  drive the prompt, visible operands, solution, and revealed result from one
  model. Calculated results must stay out of the unchecked DOM and
  accessibility text. Existing mission IDs remain stable so device-local
  completion and review records survive the release.

- 2026-07-26: Grade 6 ratio-graphs Study release (primary workstreams 01, 02,
  03, and 04) owns `unit-6-1-ratio-graphs`, `g6ratiograph-001`, its
  deterministic template bank/generator, two curriculum rows, release
  identity, and the narrow addition of a shared quantitative `ratio_graph`
  payload and renderer. One percentage model must drive every band width,
  circle sector, visible label, prompt, and solution. Segment percentages
  must sum to 100; a masked value remains textually hidden before checking,
  and no derived count or answer-only field may enter the unchecked DOM.

- 2026-07-26: Grade 6 surface-area and volume Study release (primary
  workstreams 01, 02, 03, and 04) owns `unit-6-2-surface-area-volume`,
  `g6volume-001`, its deterministic template bank/generator, three curriculum
  rows, release identity, and the narrow quantitative extension of the shared
  `cuboid` visual for open-top and partially filled models. Width, height, and
  depth must drive every face, unit conversion, surface-area/volume expression,
  and SVG proportion. Unknown dimensions remain masked before checking, and
  derived surface area or volume must not enter the unchecked DOM.

- 2026-07-26: Grade 6 circle-measurement Study release (primary workstreams
  01, 02, 03, and 04) owns the narrow addition of a quantitative
  `circle-measurement` visual payload in `src/lib/types.ts`, its shared
  problem/concept renderer, `unit-6-2-circle-measurement`, `g6circle-001`,
  deterministic template generator, release identity, curriculum rows, and
  focused renderer, generation, allocation, route, storage, and browser
  tests. One radius, optional inner radius, copy count, and π value must drive
  diameter, circumference, area, labels, solver steps, and SVG geometry.
  Requested circumference or area answers must not appear in the unchecked
  DOM or accessibility name.

- 2026-07-26: Grade 6 cube-stack spatial-reasoning Study release (primary
  workstreams 01, 02, 03, and 04) owns the narrow addition of a quantitative
  `cube-stack` visual payload in `src/lib/types.ts`, its shared problem/concept
  renderer, Grade 6 unit/concept/template data, release identity, generator,
  curriculum rows, and focused renderer, generation, allocation, route,
  storage, and browser tests. `g6spatial-001` must derive total cubes, occupied
  top cells, front and side silhouettes, lower-layer cubes, and every error
  gap from the same nonnegative height grid used by its prompt and solution.
  The renderer must not serialize a derived total or answer label into the
  unchecked DOM or accessibility name.

- 2026-07-26: Grade 6 round-solids Study release (primary workstreams 01,
  02, 03, and 04) owns the narrow addition of quantitative `round-solid`
  and `cylinder-net` visual payloads in `src/lib/types.ts`, their shared
  problem/concept renderer, Grade 6 unit/concept/template data, concept
  release identity, generator, curriculum rows, and focused renderer,
  generation, allocation, route, storage, and browser tests.
  `g6roundsolid-001` must derive every circular-base, curved-surface,
  vertex, net-circle, missing-piece, extra-piece, and repeated-solid count
  from the exact kind and copy count used by its prompt and solution.
  Visual payloads may contain only given structure and must not add a
  derived answer value to the unchecked DOM or accessibility name.

- 2026-07-26: Grade 6 prism, pyramid, and prism-net Study release (primary
  workstreams 01, 02, 03, and 04) owns the narrow addition of quantitative
  `poly-solid` and `prism-net` visual payloads in `src/lib/types.ts`, their
  shared renderer, Grade 6 unit/concept/template data, concept release
  identity, generator, curriculum rows, and focused renderer, generation,
  allocation, route, storage, and browser tests. `g6prismpyramid-001` must
  derive every face, edge, vertex, lateral-face, missing-piece, and extra-piece
  count from the same base-side parameter used by its prompt and solution.
  Visual payloads may contain only the given solid/net structure; they must not
  add a derived answer value to the unchecked DOM or accessibility name.

- 2026-07-26: Grade 6 proportion and proportional-distribution Study release
  (primary workstreams 01, 02, 03, and 04) owns the narrow change to the
  curriculum ledger, Grade 6 unit/concept/template data, concept release
  identity, and focused generator, equation, allocation, route, storage, and
  browser tests. `unit-6-2-proportion` covers `[6수02-04]` and `[6수02-05]`
  through `g6proportion-001` with 30 deterministic templates, A/B/C ten each,
  K4/A4/R2 per set, disjoint families, cross-product reasoning, real-world
  scaling, inverse proportion terms, proportional distribution, applications,
  and error analysis. Every missing term and distributed share must be
  derived from the exact ratio and total shown in the prompt and solution;
  shares must be nonnegative integers whose sum equals the displayed total.

- 2026-07-26: Grade 6 decimal-division Study release (primary workstreams
  01, 02, 03, and 04) owns the narrow change to the curriculum ledger,
  Grade 6 unit/concept/template data, concept release identity, and focused
  generator, exact-quotient, route, storage, and browser tests.
  `unit-6-1-decimal-division` covers `[6수01-14]` and `[6수01-15]` through
  `g6decimaldiv-001` with 30 deterministic templates, A/B/C ten each,
  K4/A4/R2 per set, disjoint families, natural-number quotients as decimals,
  decimal-by-natural and decimal-by-decimal calculation, inverse problems,
  applications, method comparison, and error analysis. Every quotient and
  comparison gap must be derived from the same exact integer tenths or
  hundredths model used in its prompt and solution; no repeating decimal or
  floating-point artifact may enter an accepted answer.

- 2026-07-26: Grade 6 fraction-decimal relations Study release (primary
  workstreams 01, 02, 03, and 04) owns the narrow change to the curriculum
  ledger, Grade 6 unit/concept/template data, concept release identity, and
  focused generator, comparison, route, storage, and browser tests.
  `unit-6-1-fraction-decimal-relations` covers `[6수01-12]` through
  `g6fractiondecimal-001` with 30 deterministic templates, A/B/C ten each,
  K4/A4/R2 per set, disjoint families, and fraction-to-decimal,
  decimal-to-fraction, exact size comparison, inverse conversion, application,
  and error-analysis work. All comparison differences must stay nonnegative
  for every allowed parameter and every decimal or fraction answer must be
  derived from the same exact integer ratio used in its prompt and solution.

- 2026-07-26: Grade 6 fraction-division Study release (primary workstreams
  01, 02, 03, and 04) owns the narrow change to the curriculum ledger,
  Grade 6 unit/concept/template data, multi-concept Grade 6 validation,
  per-concept receipt release identity, and focused generator, curriculum,
  route, storage, and browser tests. `unit-6-1-fraction-division` covers
  `[6수01-10]` and `[6수01-11]` through `g6fractiondiv-001` with 30
  deterministic templates, A/B/C ten each, K4/A4/R2 per set, disjoint
  families, at least two representations, and genuine application and
  reasoning work. Natural-number and fraction quotients, reciprocal steps,
  inverse checks, prompts, answers, and solutions must come from the same
  parameters. Both standards move from planned to released only with Grade 6,
  curriculum, audit, 5/10-item, mobile, storage, and deployment gates passing.

- 2026-07-26: Grade 4 line-graph release (primary workstreams 01, 03, and
  04) owns the narrow change to the curriculum ledger, Grade 4 bank,
  quantitative line-graph and source-table renderers, and focused bank,
  receipt, curriculum, component, and browser tests.
  `unit-4-2-line-graphs` covers `[4수04-02]` with ten deterministic templates,
  K4/A4/R2, ten families, two reasoning families, and at least two
  representations. Time labels, source values, plotted points, segments,
  scales, missing table cells, and deliberate plotting errors must come from
  the same data model as prompts and solutions. Answer-only derived values
  stay out of labels and accessibility text unless reading that plotted value
  is the task. The standard moves from planned to released only with all
  Grade 4, curriculum, audit, mobile, storage, and deployment gates passing.

- 2026-07-26: Grade 4 angle-measurement and interior-angle release (primary
  workstreams 01, 03, and 04) owns the narrow change to the curriculum ledger,
  Grade 4 bank, quantitative protractor and angle-sum SVGs, and focused bank,
  receipt, curriculum, component, and browser tests.
  `unit-4-1-angle-measurement` covers `[4수03-24]` and `[4수03-25]` with
  ten deterministic templates, K4/A4/R2, ten families, two reasoning
  families, and at least two representations. Ray endpoints, tick positions,
  triangle vertices, parallelogram vertices, and displayed angle labels must
  come from the same angle data as prompts and solutions. Unknown angles stay
  out of labels and accessibility text before solve. Both standards move from
  planned to released only with all Grade 4, curriculum, audit, mobile,
  storage, and deployment gates passing.

- 2026-07-26: Grade 4 polygon and shape-filling release (primary workstreams
  01, 03, and 04) owns the narrow change to the curriculum ledger, Grade 4
  bank, polygon and tiling SVGs, and focused bank, receipt, curriculum,
  component, and browser tests. `unit-4-2-polygons` covers `[4수03-11]` and
  `[4수03-12]` with ten deterministic templates, K4/A4/R2, ten families, two
  reasoning families, and at least two representations. Side count, regular
  properties, diagonals, tile rows and columns, and intentional gaps must
  drive both prompts and rendered geometry. Both standards move from planned
  to released only with all Grade 4, curriculum, audit, mobile, storage, and
  deployment gates passing.

- 2026-07-26: Grade 4 quadrilateral-classification release (primary
  workstreams 01, 03, and 04) owns the narrow change to the curriculum ledger,
  Grade 4 bank, quantitative quadrilateral SVG, and focused bank, receipt,
  curriculum, component, and browser tests. `unit-4-2-quadrilaterals` covers
  `[4수03-10]` with ten deterministic templates, K4/A4/R2, ten families, two
  reasoning families, and two representations. Vertices, parallel marks,
  equal-side marks, right-angle marks, and classifications must come from one
  quadrilateral property model. The unit moves from planned to released only
  with all Grade 4, curriculum, audit, mobile, storage, and deployment gates
  passing.

- 2026-07-26: Grade 4 triangle-classification release (primary workstreams
  01, 03, and 04) owns the narrow change to the curriculum ledger, Grade 4
  bank, quantitative triangle SVG, and focused bank, receipt, curriculum,
  component, and browser tests. `unit-4-2-triangles` covers `[4수03-08]` and
  `[4수03-09]` with ten deterministic templates, K4/A4/R2, ten families, two
  reasoning families, and two representations. Side lengths must satisfy the
  triangle inequality and drive both the classification and rendered
  coordinates. Both standards move from planned to released only with all
  Grade 4, curriculum, audit, mobile, storage, and deployment gates passing.

- 2026-07-26: Grade 4 shape-transformation release (primary workstreams 01,
  03, and 04) owns the narrow change to
  `public/data/curriculum-allocations-v1.json`, `src/lib/grade4-problems.ts`,
  the shape-transformation SVG, and focused bank, curriculum, receipt,
  component, and browser tests. The new
  `unit-4-1-shape-transformations` bank covers `[4수03-04]` and
  `[4수03-05]` with exactly ten deterministic templates, K4/A4/R2, ten
  distinct families, two genuine reasoning families, and at least two
  representations. Slides, flips, rotations, point coordinates, movement
  arrows, and revealed target shapes must come from one transformation model.
  Answer-only target coordinates stay out of visual configuration and the DOM
  before solve. Both standards move from planned to released only together
  with passing Grade 4, curriculum, mission-audit, mobile, storage, and
  deployment gates.

- 2026-07-26: Grade 4 perpendicular and parallel lines release (primary
  workstreams 01, 03, and 04) owns the narrow change to
  `public/data/curriculum-allocations-v1.json`, `src/lib/grade4-problems.ts`,
  the line-relationship SVG, and focused bank, curriculum, receipt, component,
  and browser tests. The new `unit-4-1-perpendicular-parallel` bank covers
  `[4수03-03]` with exactly ten deterministic templates, K4/A4/R2, ten
  distinct families, two genuine reasoning families, and at least two
  representations. Line directions, intersections, right-angle marks, and
  parallel spacing must come from the same geometry model as the problem.
  The standard moves from planned to released only with passing Grade 4,
  curriculum, mission-audit, mobile, storage, and deployment gates.

- 2026-07-26: Grade 4 equality-relationship release (primary workstreams 01,
  03, and 04) owns the narrow change to
  `public/data/curriculum-allocations-v1.json`, `src/lib/grade4-problems.ts`,
  the equation-balance visual, and focused bank, curriculum, receipt,
  component, and browser tests. The new `unit-4-2-equality` bank covers
  `[4수02-03]` with exactly ten deterministic templates, K4/A4/R2, ten
  distinct families, two genuine reasoning families, and at least two
  representations. Missing quantities must be derived from the two displayed
  sides, and the balance visual must not carry a result-only missing value
  before solve. The standard moves from planned to released only with passing
  Grade 4, curriculum, mission-audit, mobile, storage, and deployment gates.

- 2026-07-26: Grade 4 change and calculation-pattern release (primary
  workstreams 01, 03, and 04) owns the narrow change to
  `public/data/curriculum-allocations-v1.json`, `src/lib/grade4-problems.ts`,
  the pattern-table visual, and focused bank, curriculum, receipt, component,
  and browser tests. The new `unit-4-2-patterns` bank covers `[4수02-01]` and
  `[4수02-02]` with exactly ten deterministic templates, K4/A4/R2, ten
  distinct families, two genuine reasoning families, and at least two
  representations. Missing sequence terms, correspondence outputs, and
  calculation-array results must be derived from the displayed rows; result
  values must stay out of visual configuration and the DOM before solve. The
  two standards move from planned to released only together with passing
  Grade 4, curriculum, mission-audit, mobile, storage, and deployment gates.

- 2026-07-26: Grade 4 hundredths decimal addition and subtraction release
  (primary workstreams 01, 03, and 04) owns the narrow change to
  `public/data/curriculum-allocations-v1.json`, `src/lib/grade4-problems.ts`,
  the aligned decimal-operation visual, and focused bank, curriculum, receipt,
  component, and browser tests. The new `unit-4-2-decimal-add-sub` bank covers
  `[4수01-16]` with exactly ten deterministic templates, K4/A4/R2, ten
  distinct families, two genuine reasoning families, and at least two
  representations. All sums, differences, missing addends, carries, and
  borrows must be calculated as integer hundredths from the displayed
  operands. The aligned model may derive a result for reveal but must not put
  that result in visual configuration or the DOM before solve. The standard
  moves from planned to released only with passing Grade 4, curriculum,
  mission-audit, mobile, storage, and deployment gates.

- 2026-07-26: Grade 4 like-denominator fraction addition and subtraction
  release (primary workstreams 01, 03, and 04) owns the narrow change to
  `public/data/curriculum-allocations-v1.json`, `src/lib/grade4-problems.ts`,
  the Grade 4 fraction answer normalizer and quantitative fraction-strip
  visual, and focused bank, curriculum, receipt, component, and browser tests.
  The new `unit-4-2-fraction-add-sub` bank covers `[4수01-15]` with exactly
  ten deterministic templates, K4/A4/R2, ten distinct families, two genuine
  reasoning families, and at least two representations. Fraction input must
  distinguish incomplete syntax and zero denominators from wrong answers,
  while accepting mathematically equivalent improper and mixed forms. Every
  strip must derive its partitions and filled cells from the same operands as
  the problem, and result-only numerators must stay out of the DOM before
  solve. The standard moves from planned to released only with passing Grade
  4, curriculum, mission-audit, mobile, storage, and deployment gates.

- 2026-07-26: Grade 4 two- and three-place decimal unit release
  (primary workstreams 01, 03, and 04) owns the narrow change to
  `public/data/curriculum-allocations-v1.json`, `src/lib/grade4-problems.ts`,
  the Grade 4 decimal answer normalizer and place-value visual, and focused
  bank, curriculum, receipt, component, and browser tests. The new
  `unit-4-2-decimals` bank covers `[4수01-13]` and `[4수01-14]` with exactly
  ten deterministic templates, K4/A4/R2, ten distinct families, two genuine
  reasoning families, and at least two representations. Decimal answers use
  exact digit normalization rather than floating-point comparison; incomplete
  `.`, `0.`, and `-` input creates no wrong attempt. Composite and missing
  decimal digits must stay out of answer-only DOM before solve. Both standards
  move from planned to released only with passing Grade 4, curriculum,
  mission-audit, mobile, storage, and deployment gates.

- 2026-07-26: Grade 4 arithmetic-estimation unit release
  (primary workstreams 01, 03, and 04) owns the narrow change to
  `public/data/curriculum-allocations-v1.json`, `src/lib/grade4-problems.ts`,
  `src/components/MascotRouteCompanion.tsx`, and focused Grade 4 bank,
  curriculum, receipt, and browser tests. The new
  `unit-4-1-arithmetic-estimation` bank must contain exactly ten deterministic
  templates with K4/A4/R2, ten distinct families, two genuine reasoning
  families, and at least two representations. The four operations must all be
  represented, every estimate must be derived from the displayed operands,
  and reasoning items must compare a concrete incorrect or less useful
  estimate. The compact mobile companion must stay fully outside the Grade 4
  answer control rectangle. The ledger standard `[4수01-08]` moves from planned to released
  only with passing Grade 4, curriculum, mission-audit, mobile, storage, and
  deployment gates.

- 2026-07-26: Grade 4 two-digit-divisor unit release
  (primary workstreams 01, 03, and 04) owns the narrow change to
  `public/data/curriculum-allocations-v1.json`, `src/lib/grade4-problems.ts`,
  the Grade 4 division visual and focused validator, component, curriculum,
  and browser tests. The new `unit-4-1-multiplication-division` bank must
  contain exactly ten deterministic templates with K4/A4/R2, two genuine
  reasoning families, at least two representations, unique choices, and
  mathematically valid quotient/remainder models for every allowed variant.
  The ledger standard `[4수01-07]` moves from planned to released only in
  the same change that makes the unit selectable and passes Grade 4,
  curriculum, mission-audit, mobile, storage, and deployment gates.

- 2026-07-26: Grade 5 cuboid and cuboid-net application reinforcement
  (primary workstreams 01, 03, and 04) owns the narrow change to
  `public/data/templates/cuboid.json`,
  `public/data/templates/cuboidnet.json`,
  `scripts/generate-grade5-geometry-templates.js`,
  `scripts/migrate-grade5-blueprints.js`, the shared geometry visual type and
  renderer, and focused blueprint, topology, quantitative-layout, and browser
  tests. Both banks keep A/B/C difficulty 4-4-2 while moving to K12/A12/R6,
  ten reviewed families, and two genuine reasoning families. Cuboid dimensions
  must drive one oblique projection model, with answer dimensions masked from
  reverse-problem coordinates. Every four-option net visual must contain four
  distinct layouts and exactly one topologically foldable cube net at the
  deterministic answer index. Re-check all allowed parameters, shared-edge
  perimeter reasoning, answer-safe dimensions, mobile rendering, generator
  parity, template validation, and the problem audit before concurrent changes.

- 2026-07-26: Grade 5 congruence and symmetry application reinforcement
  (primary workstreams 01, 03, and 04) owns the narrow change to
  `public/data/templates/congruence.json`,
  `public/data/templates/symmetry.json`,
  `scripts/generate-grade5-geometry-templates.js`,
  `scripts/migrate-grade5-blueprints.js`, `src/lib/types.ts`,
  `src/components/GeometryProblemVisual.tsx`, and their focused blueprint,
  renderer, and browser tests. Both banks keep A/B/C difficulty 4-4-2 while
  moving to K12/A12/R6, ten reviewed families, and two genuine reasoning
  families. Every displayed congruent pair must be derived by a rigid
  transformation of one source polygon; rectangle contexts must render actual
  rectangles. Symmetry reasoning must analyze a concrete line- or
  point-reflection error. Re-check exact side-length preservation, answer-safe
  labels, generator parity, all allowed parameter combinations, difficulty
  progression, mobile rendering, template validation, and the problem audit
  before concurrent changes.

- 2026-07-25: Grade 5 fraction-multiplication application reinforcement
  (primary workstreams 01 and 04) owns the narrow change to
  `public/data/templates/fracmul.json`,
  `scripts/migrate-grade5-blueprints.js`, its deterministic generator, and
  blueprint regression tests. The `unit-5-2-fraction-mul` bank must keep
  A/B/C difficulty 4-4-2 while moving from K21/A9/R0 and five families to
  K12/A12/R6 and ten reviewed families. Include fraction-by-natural,
  fraction-by-fraction, cancellation, real-world part-of-whole, inverse
  factor, fractional area, denominator-error, and product-size reasoning.
  Re-check proper positive parameter construction, reduced answers, choice
  uniqueness across every allowed combination, generator parity, difficulty
  progression, template validation, and the problem audit.

- 2026-07-25: Grade 5 average application reinforcement (primary workstreams
  01 and 04) owns the narrow change to
  `public/data/templates/average.json`,
  `scripts/migrate-grade5-blueprints.js`, its deterministic generator, and
  blueprint regression tests. The bank must keep A/B/C difficulty 4-4-2 while
  moving from K18/A12/R0 and four families to K12/A12/R6 and ten reviewed
  families. Construct values so every displayed mean is exact rather than a
  rounded repeating decimal. Applying items cover real-world means, a missing
  value, and a target next value; reasoning items analyze a wrong divisor and
  the effect of correcting one record. Re-check generator parity, exact
  divisibility, Korean wording, choice uniqueness, difficulty progression,
  template validation, and the problem audit before concurrent changes.

- 2026-07-25: Grade 5 decimal-multiplication application reinforcement
  (primary workstreams 01 and 04) owns the narrow change to
  `public/data/templates/decimalmul.json`,
  `scripts/migrate-grade5-blueprints.js`, its deterministic generator, and
  blueprint regression tests. The bank moves from K27/A3/R0 and three
  mathematical families to A/B/C K4/A4/R2 and ten families. Applying items
  cover repeated quantity, combined total, rectangle area, and remaining
  quantity. Reasoning items analyze a missed decimal point and compare products
  when one factor becomes one tenth. Re-check decimal string evaluation,
  positive subtraction ranges, Korean numeric particles, generator parity,
  choice correctness, and difficulty progression before concurrent changes.

- 2026-07-25: Grade 5 mixed-calculation application reinforcement (primary
  workstreams 01 and 04) owns the narrow change to
  `public/data/templates/mixedcalc.json`,
  `scripts/migrate-grade5-blueprints.js`, its deterministic generator, and
  blueprint regression tests. A/B/C keep the 4-4-2 difficulty contract while
  moving from K30/A0/R0 to K12/A12/R6. Applying items translate inventory,
  combined-group, assortment, and remaining-per-group situations into one
  mixed expression. Reasoning items compare the correct parenthesized model
  with a plausible missing-parentheses error. Re-check Korean numeric
  particles, positive parameter ranges, generator parity, choice correctness,
  difficulty progression, and the problem audit before concurrent changes.

- 2026-07-25: Grade 5 directed-estimation application reinforcement (primary
  workstreams 01 and 04) owns the narrow change to
  `public/data/templates/estimate.json`,
  `scripts/migrate-grade5-blueprints.js`, and its deterministic generator and
  blueprint regression tests. The bank keeps A/B/C 4-4-2 while moving from
  K30/A0/R0 to K12/A12/R6. Applying items must use upward estimates for safe
  capacity and downward estimates for complete groups; reasoning items must
  expose the consequence of choosing the wrong bound or compare both bounds.
  Re-check non-multiple parameter construction, remainder/shortage arithmetic,
  generator parity, validation, and problem audit before concurrent changes.

- 2026-07-25: Grade 5 rounding application-problem reinforcement (primary
  workstreams 01 and 04) owns the narrow change to
  `public/data/templates/rounding.json`,
  `scripts/migrate-grade5-blueprints.js`, and the corresponding Grade 5
  blueprint regression tests. The 30 slots keep the A/B/C 4-4-2 difficulty
  contract while moving from K30/A0/R0 to K12/A12/R6 through ten reviewed
  mathematical families. Re-check deterministic generation, reviewed
  blueprint equality, direct/inverse boundary behavior, method-comparison
  arithmetic, template validation, and the problem-quality audit before
  changing these files concurrently.

- 2026-07-21: approved Grade 5 semantic corrections and Grade 6 public
  promotion (primary workstreams 01, 02, 03, and 04) close the nine blocked
  Grade 5 blueprint slots, redesign `g6ratio-001` so A/B/C use materially
  different problem families, add a rendered answer-safe ratio table visual,
  and promote Grade 6 only after corrupt-session recovery, 48px/two-viewport
  browser gates, home projection, and ledger checks pass. Grade 5 saved
  problem snapshots remain unchanged. Grade 6 keeps its isolated storage
  namespaces and must preserve corrupt bytes until the learner explicitly
  resets only the affected key. Re-check `src/lib/types.ts`, template
  generation, curriculum references, session/result routing, home preference
  compatibility, answer leakage, and all direct Grade 6 paths before changing
  these contracts.

- 2026-07-21: Grade 6 release-candidate fail-closed gate (primary workstreams
  02 and 04) keeps candidate unit/concept/template data in static output but
  blocks every Grade 6 learning entry until
  `curriculum-allocations-v1.json.releaseState.grade6 === "released"`.
  `src/lib/grade-release.ts` is the single public-ledger adapter used by the
  Grade 6 index and shared unit, concept, practice, and result routes. Fetch,
  schema, and unknown-state failures remain blocked and must not create,
  overwrite, or clear Grade 6 progress/session/result. Re-check every direct
  URL and Grade 5 continuity before changing the ledger release state.

- 2026-07-21: safe arithmetic expression evaluator (primary workstream 04;
  Grade 5 and Grade 6 generator consumers) owns the narrow change to
  `src/lib/problem-generator.ts`, new `src/lib/arithmetic-expression.ts`, and
  the narrow runtime-generator loader in `scripts/problem-quality-core.js`.
  The generator keeps registered function evaluation, but numeric arithmetic
  is parsed without `eval` and accepts only finite decimal literals,
  parentheses, `+ - * /`, and unary signs. Re-check deterministic Grade 5/6
  generation, Grade 6 and template validators, problem audit,
  function-argument arithmetic, division by zero, invalid/trailing tokens, and
  CSP compatibility. No template, session, home, or active Grade 6 file is part
  of this change.

- 2026-07-21: Grade 6 Study minimum release (primary workstreams 01, 02, and
  04) reuses the shared unit/concept/template practice engine with Grade
  6-prefixed content IDs. `src/lib/types.ts`, `src/lib/session.ts`, and
  `src/lib/progress.ts` gain optional grade/item-count routing while preserving
  legacy Grade 5 snapshots and exact Grade 5 storage keys. Grade 6 owns
  isolated `mathAssist_grade6CurrentSession`, `mathAssist_grade6LastResult`,
  and `mathAssist_grade6Progress` namespaces, defaults to 5 questions, and
  offers 10 explicitly. Re-check legacy Grade 5 normalization, retry routing,
  static export params, progress isolation, and both 5/10 completion paths.
  Curriculum-ledger promotion is concurrently owned by the Grade 4 lane and
  must be reconciled only after that validator contract is finished.

- 2026-07-21: Phase 4 mission ScratchPad route integration (primary workstreams
  02 and 03; browser checks in workstream 04) connects persisted sketches to
  the real Grade 1, 2, and 3 mission clients in addition to Grade 5 practice.
  `src/lib/mission-sketch-identity.ts` derives stable guest/session/item keys
  from each grade's deterministic run and concrete variant. Navigation and
  reload restore the same item; explicit retry starts a new session; completed
  and expired documents are read-only. All connected surfaces keep the shared
  WebKit selection guard and 48px ScratchPad controls. Re-check key continuity
  if mission seed, replay, or explicit session storage changes.

- 2026-07-21: Phase 3B home projection adoption (primary workstream 02) changes
  `src/lib/guest-home.ts` so completed, review, recent activity, and Grade 5
  resumable-session validity come from `LocalProgressRepository`. Grade-specific
  today counts, selected-unit copy, and Grade 5 set links remain read-only legacy
  details. The home still writes only `mathAssist_guestHome_v1`; re-check valid
  legacy equivalence, malformed Grade 5 session rejection, and raw-key equality
  when Grade 4/6 are activated.

- 2026-07-21: Phase 3C mission receipt wiring (primary workstream 02; browser
  checks in workstream 04) adds `src/lib/mission-attempt-receipt.ts` and connects
  the Grade 1, 2, and 3 valid answer-check boundaries. Existing progress and
  reward keys remain authoritative; `mathAssist_attemptReceipts_v1` is an
  append-only supplemental ledger. Format errors append nothing, retry ordinals
  are stored separately from stable item IDs to distinguish intentional checked
  attempts, and repeated delivery of the same ordinal is idempotent. Receipts
  contain neither raw learner answers nor sketch strokes. Re-check this bridge
  if mission session persistence or retry identity changes.

- 2026-07-21: ScratchPad V1 document and local retention foundation (primary
  workstream 03; storage port in workstream 02) is owned in new
  `src/lib/sketch-document.ts` and `src/lib/sketch-repository.ts` modules.
  Phase 4A stores normalized stroke/eraser/clear commands per stable
  learner/session/item key, keeps undo history branches deterministic, and
  enforces 256 KiB per item plus recent-50 retention without deleting active
  session sketches. It does not connect to `ScratchPad.tsx` yet and must not
  change the established WebKit pointer/selection contract. Re-check corrupt
  item isolation, active-session retention, and key stability before UI wiring.

- 2026-07-21: Phase 4B/4C ScratchPad component and ExperiencePreset bridge
  (primary workstream 03; integration consumers in workstreams 02 and 03)
  evolves `src/components/ScratchPad.tsx` to consume either a controlled
  `SketchDocument` or the stable learner/session/item repository key. It keeps
  the established WebKit gesture listeners and pointer isolation while adding
  normalized replay, recovery, pen/eraser/clear history, undo/redo, resize
  reprojection, save-state feedback, and 48px controls. The no-prop component
  remains an unpersisted compatibility mode until each learning route supplies
  stable identity. `src/lib/experience-preset.ts` owns presentation-only Grade
  1-2 play, 3-4 bridge, and 5-6 study contracts; grading and progress must not
  import it. Re-check item-key uniqueness, active-session retention injection,
  and real WebKit painted-pixel behavior when routes adopt the component.

- 2026-07-21: Phase 5B private-staging remote authentication core (primary
  workstream 02; security verification in workstream 04) is owned under
  `src/lib/server/remote-auth-core.ts`. This is a Node-only domain boundary and
  must not be imported by `src/app`, `src/components`, or any client bundle.
  It may define repository and audit ports plus an in-memory fixture, but must
  not expose an HTTP route, cookie policy, CSRF/CORS behavior, database choice,
  or enable the production remote flag. Stored records contain only salted
  verifier material and session-token hashes; raw PIN, recovery code, and
  session token may leave the core only at their one-time creation boundary.
  Account+initial-session and recovery-rotation+new-session repository methods
  are atomic. Self revoke-all accepts a valid session token rather than a caller
  supplied learner number. Production construction requires a stable secret
  audit pepper; automatic pepper generation is test-cost-only. Re-check
  enumeration resistance, account/network/pair rate-limit keying, recovery
  single use, revoke-all, audit redaction, runtime bounds, and client import
  isolation before any provider or staging route adopts this module.

- 2026-07-21: Phase 5B guardian-consent provisioning gate (primary workstream
  02; privacy/security verification in workstream 04) is owned under
  `src/lib/server/remote-account-provisioning.ts`. Remote account creation must
  not call `RemoteAuthCore.createAccount` directly from a route or UI. A valid,
  verified, unexpired, purpose- and policy-matched one-time authorization bound
  to the same pre-account learner request must be consumed in the same atomic
  unit as auth account creation. Failure rolls back both authorization use and
  account/session creation. Consent artifacts contain hashes and verification
  state only, never guardian contact or raw authorization/binding secrets.
  Actual legal sufficiency, guardian verification method, artifact retention,
  withdrawal/deletion, and production provider remain blocked decisions.

- 2026-07-21: integrated storage/security QA hardens Phase 4/5 infrastructure.
  Remote progress envelopes are strict runtime allowlists and reject raw answer,
  sketch, foreign-learner, oversized, and malformed fields before read or merge.
  Grade 1-3 corrupt progress and corrupt sketch documents are preserved and
  blocked from automatic overwrite until an explicit reset/recovery action.
  Local rollback backup covers the confirmed Grade 4 progress and Grade 6
  progress/current-session keys. A current session can contain device-local
  draft answers but is never a remote payload; Grade 6 last-result snapshots,
  sketch strokes, and account secrets are excluded. Keep production
  remote disabled until dependency upgrades and a real transactional provider,
  distributed limiter, session expiry, TLS/cookie/CORS/CSRF, and consent policy
  decisions are complete.

- 2026-07-21: common read-only learning activity and progress projection
  (primary workstream 02; consumers in home and future experience shells)
  is owned in new `src/lib/learning-activity.ts` and
  `src/lib/local-progress-repository.ts` modules. The first slice reads the
  existing Grade 1/2/3/5 progress keys and Grade 5 active session without
  calling destructive grade loaders or rewriting any key. It does not change
  `src/lib/types.ts`, `src/lib/session.ts`, or existing progress schemas.
  Re-check legacy fixture projections, corrupt-grade isolation, and raw storage
  equality before changing a progress key or adopting these contracts in UI.

- 2026-07-21: Grade 5 problem-blueprint metadata migration (primary workstreams
  01 and 04)
  `src/lib/types.ts` and `src/lib/problem-generator.ts` gain an optional
  `ProblemBlueprintMeta` bridge that keeps old saved problems and the existing
  660-template bank readable while metadata is reviewed concept by concept.
  Declared metadata must be complete and valid; undeclared metadata is counted
  as missing coverage by `audit:problems` and must not be inferred from
  `difficulty`. Re-check template generation, session serialization, content
  validation, and coverage reports when adding or renaming blueprint fields.
  M1 has reviewed metadata for 210 geometry/application templates. M2 reviewed
  the remaining 450 templates and added explicit problem-family/blueprint
  metadata to 441 of them. Nine templates (`fracmul` 06, `fracsub` 06, and
  `average` 08 across A/B/C) deliberately remain missing because their prompt,
  solver, or concept semantics conflict. Current coverage is 651/660 complete,
  9 missing, 0 invalid; do not make metadata mandatory or assign standards to
  those nine until their content correction is approved and tested.

- 2026-07-25: Grade 5 fraction addition/subtraction quality upgrade (primary
  workstreams 01 and 04) owns `public/data/templates/fracadd.json`,
  `public/data/templates/fracsub.json`,
  `scripts/generate-grade5-fraction-addsub-templates.js`,
  `scripts/migrate-grade5-blueprints.js`, and the focused reproducibility and
  exhaustive-combination checks in
  `src/lib/grade5-blueprint-metadata.test.ts`. Preserve the existing template
  IDs and A/B/C 4·4·2 difficulty contract while replacing the two four-family,
  K18/A12/R0 banks with ten-family K12/A12/R6 banks. Subtraction parameter
  structures must prove a positive result for every allowed combination.

- 2026-07-25: Grade 5 fraction simplification/common-denominator quality
  upgrade (primary workstreams 01 and 04) owns
  `public/data/templates/simplify.json`,
  `public/data/templates/commonden.json`,
  `scripts/generate-grade5-fraction-simplify-templates.js`,
  `scripts/migrate-grade5-blueprints.js`, and the focused exhaustive checks.
  Consecutive reduced numerator/denominator pairs must keep simplification
  exact; consecutive source denominators must keep the least common denominator
  equal to their product for every allowed parameter combination.

- 2026-07-26: Grade 5 divisor/multiple/GCD/LCM quality upgrade (primary
  workstreams 01 and 04) owns the four matching template JSON files,
  `scripts/generate-grade5-divisor-multiple-templates.js`,
  `scripts/migrate-grade5-blueprints.js`, and focused exhaustive tests.
  Construct GCD/LCM operands from a shared factor and consecutive cofactors so
  the declared greatest/least common value is exact for every parameter tuple.

- 2026-07-26: Grade 5 pattern quality upgrade (primary workstreams 01 and 04)
  owns `public/data/templates/pattern.json`,
  `scripts/generate-grade5-pattern-templates.js`,
  `scripts/migrate-grade5-blueprints.js`, and focused exhaustive tests.
  Preserve deterministic integer rules while expanding the bank to distinct
  input-output, inverse, context, comparison, and error-analysis families.

- 2026-07-26: Grade 5 perimeter and polygon-area quality upgrade (primary
  workstreams 01 and 04) owns the two matching template JSON files,
  `scripts/generate-grade5-geometry-templates.js`,
  `scripts/migrate-grade5-blueprints.js`, and focused quantitative-visual
  checks. Every prompt, solver, and polygon visual must describe the same
  single mathematical model; `area.json` remains an unchanged regression bank.

- 2026-07-21: quantitative three-shape overlap repair (primary workstream 03,
  dependencies on workstreams 01 and 04)
  `src/lib/types.ts`, `src/lib/problem-generator.ts`, and
  `public/data/templates/area.json` classify `three_shape_overlap` as a
  quantitative visual. New problems carry a derived seven-region area model;
  the renderer must also derive that model for older saved problem snapshots
  that do not contain it. Re-check template validation, answer-safe DOM output,
  session serialization, zero-region omission, and exact unit-cell ratios.

- 2026-07-19: guest landing and learning home (primary workstream 03)
  `/` is now a public landing, `/home` is the device-local learner home, and
  `/grade/5` owns the Grade 5 unit list. `src/lib/guest-home.ts` reads the
  existing Grade 1/2/3 progress keys, Grade 5 concept progress, and the current
  two-hour practice session without rewriting them. The only new key is
  `mathAssist_guestHome_v1`, currently `{ activeGrade }`. Re-check the home
  adapter whenever a progress schema or storage key changes. Details are in
  `docs/landing-home-guest-v1.md`.

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
- 2026-07-19: iPadOS scratch-pad input stabilization (primary workstream 03)
  The shared practice surface now blocks WebKit text selection and native
  canvas selection gestures, isolates active pointers, and tolerates pointer
  capture failure. The user verified the final fix on an iPad. Preserve the
  interaction contract in `docs/scratch-pad-ipados-lessons-learned.md`; the
  handoff is `handoffs/2026-07-19-03-ui-and-visuals-codex.md`.
