# T11 Report — V1 approval and release promotion

## Approval authority

- ownerId: `project-owner`
- approvedAt: `2026-07-28T09:05:24Z`
- approval evidence: `docs/reviews/application-problems-v1-approval.md`
- expertStatus: `not-reviewed`

The recorded owner approval is: “9개 V1 유형의 출시 승격을 승인합니다”. This promotes
only the three V1 pilot packs and nine listed `familyId@version` snapshots; it
does not claim all grades or application-problem types are complete.

## RED

Before production metadata changed, focused release assertions failed because:

- all three packs and nine family sources were `draft` / `pending`;
- the production release ledger selected zero runtime candidates;
- Grade 2 exposed only its legacy 144 missions; and
- the quality report counted 9 draft families and 0 approved families.

The initial release-contract Vitest run reported 11 expected failures across
pack metadata, family metadata, runtime selection, Grade 2 integration, and
the production quality summary.

## GREEN

- Promoted exactly three packs and nine V1 family snapshots with the exact
  owner, timestamp, evidence reference, and `expertStatus: not-reviewed`.
- Added immutable approval evidence describing the V1 pilot boundary and the
  visual/quality/recovery review scope.
- Confirmed production registry entries and its independent release ledger
  have matching approval snapshots and select exactly nine unique candidates.
- Kept Grade 2 legacy missions and appended three approved application
  missions. Grade 5/6 continue to generate exact 10 and 5/10 question
  sessions with their required difficulty mixes.
- Re-pinned proof source digests after the immutable family metadata changed.
- Updated the quality audit so application candidates contribute their declared
  placement difficulty and Grade 2 counts legacy missions plus approved
  candidates, rather than rejecting the intended release.

## Verification

- `npx vitest run src/lib/application-problems/contracts.test.ts src/lib/application-problems/runtime-integration.test.ts src/lib/application-problems/grade2-learning-runtime.test.ts src/lib/problem-generator.test.ts src/lib/session.test.ts src/lib/application-problems/families/g2-length-families.test.ts src/lib/application-problems/families/grade5-geometry-families.test.ts src/lib/application-problems/families/g6-ratio.test.ts src/lib/application-problems/families/g6-ratio-proof.test.ts src/lib/curriculum-allocation.test.ts src/lib/application-problem-quality-audit.test.ts` — 176 passed
- `npm run validate:application-packs` — 9 families, 0 errors
- `npm run audit:applications` — 0 errors; 9 approved, 0 draft
- `npm run validate:curriculum`, `npm run validate:grade2`, `npm run validate:grade6` — passed
- `npm run lint` — passed
- `npm run tdd:guard` — passed

## Remaining concerns

- `expertStatus` deliberately remains `not-reviewed`.
- This is a V1 pilot release, not a claim of complete all-grade or all-type
  coverage.
- T12 remains responsible for its separately specified full verification order.

## Fix round 1 — immutable release ledger and Grade 2 test typing

### RED

The production `releaseLedger` reused the family object from each executable
entry. The new registry test failed with the ledger snapshot and
`g5-perimeter-boundary-rebuild` runtime family being the same object, which
would let a mutation hide a ledger mismatch.

### GREEN

- `APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger` now creates a separate,
  contract-canonicalized JSON snapshot for each family and recursively freezes
  the snapshot, nested approval object, and evidence array.
- A forged registry with only the runtime entry's `ownerId` changed retains the
  ledger's `project-owner` value and selects 8, not 9, candidates.
- Grade 2 runtime assertions now narrow missions through
  `isGrade2ApplicationMission` before accessing `applicationSource`.

### Fix-round verification

- Focused registry/Grade 2 Vitest: 12 passed.
- Release-focused Vitest suite: 177 passed.
- `npm run validate:application-packs`, `npm run audit:applications`,
  `npm run lint`, and `npm run tdd:guard`: passed.
- `npx tsc --noEmit` has no diagnostics in this round's changed files
  (`registered-families.ts`, `runtime-integration.test.ts`, or
  `grade2-learning-runtime.test.ts`). The command still reports unrelated
  existing diagnostics in component tests, `visual-model.test.ts`,
  `curriculum-allocation.test.ts`, Grade 4/6 tests, and remote-auth tests.

## Fix round 2 — detached learner-shard release ledgers

### RED

The immutable snapshot builder from fix round 1 lived only in
`registered-families.ts`. Learner routes consume the Grade 2/5/6 shard
registries directly, so each shard still aliased every executable
`entry.family` from its `releaseLedger`. The new parameterized shard test
reproduced the same object-identity failure independently for all three grades.

### GREEN

- Moved the canonical deep-clone/deep-freeze builder into the shared
  `registry.ts` layer without adding an import cycle.
- Applied the same builder to the Grade 2, Grade 5, Grade 6, and aggregate
  release ledgers.
- Each shard now selects exactly 3 approved candidates, while the aggregate
  still selects 9. A forged runtime-family owner leaves the shard ledger and
  original family export unchanged and removes only that candidate (3 to 2).
- Ledger roots, nested approval objects, and evidence arrays are all distinct
  from executable metadata and frozen.

### Fix-round verification

- Focused registry/runtime/Grade 2/5/6 shard Vitest: 20 passed.
- Expanded release-focused Vitest suite: 185 passed.
- `npm run validate:application-packs`, `npm run audit:applications`,
  `npm run lint`, and `npm run tdd:guard`: passed.
- `npx tsc --noEmit` has no diagnostics in this round's changed registry and
  runtime-integration files; unrelated existing diagnostics remain outside
  this change.

## Fix round 3 — approved production defaults in related tests

### RED

The interaction and Grade 2 client suites still treated the production
registries as draft-by-default. The two-file run reproduced three failures:
default Grade 2/5/6 interaction was `ready` rather than `blocked`, a valid
Grade 6 snapshot was gradable, and the Grade 2 UI no longer showed a blocked
replacement state without an explicit blocked registry.

### GREEN

- Updated positive default assertions to the approved production contract:
  Grade 2/5/6 interaction is ready and a valid Grade 6 snapshot is gradable.
- Preserved explicit empty-ledger, duplicate-ledger, quarantined, malformed,
  wrong-grade, and wrong-answer blocked coverage, plus retired ready coverage.
- The Grade 2 UI preservation test now supplies a quarantined current family
  with no higher approved replacement. It still verifies hidden problem and
  answer content, no replacement button, and byte-for-byte progress retention.
- No product logic or approval metadata changed.

### Fix-round verification

- The two affected files: 15 passed after the initial 3-failure RED run.
- Expanded release-focused Vitest suite: 200 passed.
- `npm run validate:application-packs`, `npm run audit:applications`,
  `npm run lint`, and `npm run tdd:guard`: passed.
- `npx tsc --noEmit` has no diagnostics in the two changed test files.

## Fix round 4 — explicit unreleased client fixtures

### RED

Two client dispatch tests omitted the registry while expecting an unreleased
state. Because the production Grade 5 registry is now approved by default, the
affected six-test run reproduced two failures: `ProblemCard` and `ResultCard`
rendered released content instead of the expected alert-only state.

### GREEN

- Added an explicit Grade 5 draft/pending registry fixture with independent
  family entries and matching immutable release-ledger snapshots.
- Injected that fixture into the unreleased `ProblemCard` and `ResultCard`
  tests, preserving the alert and prompt/answer/solution/control
  non-disclosure assertions.
- The positive `ProblemCard` assertion now exercises the actual approved
  production default. The positive `ResultCard` assertion retains its
  synthetic approved registry coverage.
- No product logic or approval metadata changed.

### Fix-round verification

- Affected client dispatch file: 6 passed after the initial 2-failure RED run.
- Full `npm test`: 87 files and 729 tests passed.
- `npm run lint` and `npm run tdd:guard`: passed.
- `npx tsc --noEmit` has no diagnostics in the changed client test file.
- The staged diff check passed.
