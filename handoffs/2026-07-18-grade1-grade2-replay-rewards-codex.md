# Grade 1/2 Replay and Rewards V1 Handoff

Date: 2026-07-18
Workstream: `workstreams/02-learning-loop`

## What changed

- Expanded Grade 1 from 60 to 96 missions and Grade 2 from 72 to 144 missions.
- Added deterministic local-day and replay seeds plus per-concrete-problem variant
  keys.
- Migrated Grade 1 and Grade 2 local progress from schema v1 to v2 without
  dropping existing completion, review, or selected-unit state.
- Added shared XP, levels, gentle streaks, an 8-problem daily goal, spaced mastery
  stars, duplicate reward protection, and five achievements.
- Added a Grade 2 reward collection and displayed mastery stars in both mission
  selectors.
- Added focused unit, component, quality-audit, migration, and replay E2E tests.
- Completed game-client text-state, screenshot, and console-error checks.

## Still risky

- The added V1 missions intentionally reuse vetted deterministic templates. The
  long-run test guarantees at least 840 combined concrete signatures, but Grade
  2 variation is uneven because some visual/input contracts are fixed by design.
- Progress is localStorage-only. Clearing browser data removes XP and mastery,
  matching the current product architecture.
- Review intervals use elapsed 24-hour durations while daily seed/streak labels
  use the learner device's local calendar day. This is intentional.
- Keep the 500-entry concrete-key retention bound in mind if future rewards need
  lifetime-perfect duplicate detection rather than recent-history protection.

## What the next agent should do

- Preserve existing mission IDs when revising content so migrated progress stays
  attached to the right mission.
- Add a distinct deterministic generator when expanding a cloned mission family;
  raise the long-run signature floors when new variation is real.
- Keep hints non-punitive and deterministic grading binary.
- Run the full commands in `docs/grade1-grade2-replay-rewards-v1.md`, then inspect
  both grade routes at tablet and mobile sizes after reward or mission-list edits.
