# Application Problems V1 Approval

## Approval record

- approval: “9개 V1 유형의 출시 승격을 승인합니다”
- ownerId: `project-owner`
- approvedAt: `2026-07-28T09:05:24Z`
- expertStatus: `not-reviewed`

This is an owner approval for the V1 pilot release. It does not claim that all
grades, units, or application-problem types are complete, and it does not
represent an expert review.

## Approved scope

The approved packs are `pack-g2-2-length`, `pack-unit-5-1-perimeter-area`, and
`pack-unit-6-1-ratio`. The approved `familyId@version` snapshots are:

- `g2-length-route-total@1`
- `g2-length-missing-segment@1`
- `g2-length-claim-check@1`
- `g5-perimeter-boundary-rebuild@1`
- `g5-area-composite-inverse@1`
- `g5-area-overlap-reconstruction@1`
- `g6-ratio-part-whole@1`
- `g6-ratio-relative-comparison@1`
- `g6-ratio-representation-check@1`

## Review and verification evidence

The approval covers the T10 internal review surface together with the recorded
automated quality and visual safety checks: deterministic generation,
independent answer/oracle checks, required quantitative-visual validation,
pre-submit answer-exposure checks, release-ledger agreement, and Grade 2/5/6
session and recovery contracts. The release gate requires the repository
quality audit and application-pack validator to pass for these nine immutable
V1 snapshots.
