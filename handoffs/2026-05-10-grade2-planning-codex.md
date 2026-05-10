# 2026-05-10 Grade 2 Planning Handoff

## What changed

- Added `docs/grade2-curriculum-implementation-notes.md` to capture the Grade 2
  curriculum investigation and architecture implications from this session.
- Documented the 2022 revised curriculum baseline, including the fact that
  official achievement standards are for the `1-2학년군` and should be mapped to
  Grade 2 semester units for product sequencing.
- Recorded a Grade 2 scope map across 2-1 and 2-2 units.
- Compared the existing Grade 1 adventure implementation against Grade 2 needs.
- Identified the main extensions needed before Grade 2 can be implemented:
  visual models, answer type expansion, length/time normalization, and stronger
  validator checks.

## Reading order for the next agent

1. `docs/grade2-curriculum-implementation-notes.md`
2. `docs/grade1-adventure-scaleup.md`
3. `src/lib/grade1-problems.ts`
4. `src/components/grade1/Grade1MissionVisual.tsx`
5. `src/app/grade/1/Grade1GameClient.tsx`
6. `src/lib/grade1-progress.ts`
7. `e2e/learning-loop.spec.ts`
8. `workstreams/_shared/README.md`
9. `workstreams/01-content-and-curriculum/README.md`

## Key finding

Grade 2 should reuse the Grade 1 adventure loop, but it should not reuse the
Grade 1 mission contract unchanged.

Reusable:

- deterministic mission templates
- one mission per screen
- binary grading
- hint and review flow
- reward-to-next continuation
- localStorage progress recovery

Needs expansion:

- `place-value-blocks`
- `vertical-operation`
- `array-groups`
- `ruler-line`
- `classification-table`
- `mark-graph`
- `multiplication-table`
- length and time answer normalizers
- Grade 2-specific validator

## Recommended next-session goal

Do not start by implementing all Grade 2 content. Start by creating a concrete
Grade 2 implementation plan and Alpha phase.

Suggested deliverables for the next session:

1. Define the Grade 2 Alpha scope: 36 missions, 12 units x 3 missions.
2. Choose the Grade 2 theme and map structure.
3. Draft the Grade 2 mission contract in a plan or phase file.
4. Decide which visual models are Alpha-critical.
5. Decide accepted answer formats for length and time.
6. Register a harness phase, for example `phases/grade2-adventure-alpha/`.
7. Split implementation work across content, learning loop, UI, and quality
   workstreams.

## Suggested phase breakdown

Step 1: Contract and validators

- Add `src/lib/grade2-problems.ts`.
- Add Grade 2 skills, answer types, visual models, and safe fallback mission.
- Add `scripts/validate-grade2-problems.js`.
- Add tests for deterministic rendering and validator failures.

Step 2: Normalizers

- Add length normalizer, probably canonical centimeters.
- Add time normalizer, keeping time-of-day and duration separate.
- Add tests for equivalent answers such as `1m 20cm` and `120cm`.

Step 3: Alpha mission bank

- Add 36 missions across the 12 Grade 2 units.
- Keep all answers deterministic and all choices unique across sampled seeds.
- Include `curriculumCode` or equivalent metadata so each mission traces back to
  `[2수..]`.

Step 4: UI and visual models

- Add `/grade/2` route.
- Reuse the Grade 1 learner loop.
- Add Grade 2 renderers for place value, vertical operations, arrays, ruler,
  classification table, and mark graph.
- Browser-check desktop and mobile widths.

Step 5: Quality gates and handoff

- Add focused unit tests and E2E smoke coverage.
- Run `npm run validate:grade2`, focused tests, `npm run build`, and E2E.
- Update this handoff or create a new dated handoff with what changed and what
  remains risky.

## Current risks

- The repo has unrelated dirty harness/TDD migration files. Do not mix those
  changes into a Grade 2 content or UI commit unless the task explicitly covers
  harness work.
- The existing Grade 1 number answer path only accepts digits. Grade 2 length
  and time work will fail if this is copied unchanged.
- The older `public/data` and `problem-generator.ts` flow is for the main
  practice app and Grade 5 content. Avoid changing it for Grade 2 Alpha unless a
  shared-contract decision is documented in `workstreams/_shared/README.md`.
- Grade 2 graph and classification missions need validator checks that the
  rendered counts match the correct answer.

## Verification completed in this session

- `npm run validate:grade1`
- `npm run test -- src/lib/grade1-problems.test.ts src/lib/grade1-progress.test.ts src/components/grade1/grade1-components.test.ts`

No production code was changed for this handoff. Documentation-only changes do
not require the TDD gate because they do not touch `src/**` or `public/data/**`.

## First action for the next agent

Create or update a planning phase for Grade 2 Alpha. The phase should reference
`docs/grade2-curriculum-implementation-notes.md` and should keep the first code
change inside Grade 2-specific files unless the plan explicitly justifies a
shared contract extraction.

