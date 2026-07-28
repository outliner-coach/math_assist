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
