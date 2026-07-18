# Grade 1/2 Replay and Rewards V1

Date: 2026-07-18
Owner lane: `workstreams/02-learning-loop`

## Outcome

Grade 1 and Grade 2 now support short daily sessions and meaningful replay
instead of a one-time fixed path.

| Surface | Previous Beta | Current V1 |
| --- | ---: | ---: |
| Grade 1 authored missions | 60 | 96 |
| Grade 2 authored missions | 72 | 144 |
| Grade 2 missions per unit | 6 | 12 |
| Combined authored missions | 132 | 240 |
| Long-run concrete-variant test floor | not measured | at least 840 |

The 840 figure is a conservative regression floor measured across 200 seeds:
at least 500 distinct Grade 1 signatures and 340 Grade 2 signatures. It is not a
claim that the generator has exactly 840 variants or that every authored mission
is infinitely variable.

## Content Shape

Grade 1 has 96 missions across seven islands:

- Count Cove, Order Bridge, Orchard Port, River Dock, Shape Forest: 14 each
- Clock Tower, Pattern Cave: 13 each

Grade 2 has 12 curriculum units with 12 missions per unit. Every unit keeps a
4 easy / 4 medium / 4 applied balance. Existing mission IDs are preserved, and
the additional V1 rounds reuse the validated deterministic answer and visual
contracts.

## Replay Contract

- The first problem seed is stable for the learner's local calendar day.
- Grade 1 and Grade 2 use separate seeds.
- `한 번 더 풀기` increments the replay round and asks the current mission
  again. Parameterized missions usually render another concrete problem; a
  fixed-data mission may intentionally repeat.
- A concrete completion key fingerprints the rendered prompt, correct answer,
  choices, and visual data under its mission ID. A changed seed alone is not
  enough to create a rewardable variant.
- Solving the same concrete key again may increment the attempt count, but does
  not grant XP, mastery correctness, or the daily solved count twice.
- The browser replay regression explicitly covers Grade 2's fixed first
  place-value mission: its changed replay seed still leaves XP and the daily
  goal unchanged because the rendered problem is identical.
- Daily seed, learning dates, and the daily goal all change at the learner
  device's local midnight.

## Reward Contract

XP is additive and never decreases:

- correct concrete variant: 10 XP
- first try without a hint: +5 XP
- review completed after its due time: +5 XP
- optional non-negative mission difficulty bonus

Hints do not reduce existing XP and there is no partial credit. A learner who
uses a hint still receives the 10 XP completion reward. The bonus communicates
productive behavior without turning help-seeking into a punishment.

One level is 100 XP. The shared progress panel shows level progress, an 8-problem
daily goal, a gentle learning streak, mastery stars, concrete variants solved,
and five achievements. Grade 2 additionally shows the eight existing reward
families as a collection with earned counts.

## Mastery and Review

Mastery is stored per authored mission:

- 1 star: one correct concrete variant
- 2 stars: at least one first-try, hint-free correct answer
- 3 stars: at least one correct spaced review after it becomes due

Review intervals progress through 1, 3, 7, and 21 days. The gentle streak stays
visible when the last learning date is today or yesterday, so missing the current
day does not immediately erase the learner's continuity signal.

Achievements unlock for the first correct mission, reaching level 2, completing
the daily goal, building a three-day streak, and collecting 10 mastery stars.

## Storage Migration

Both localStorage records use schema version 2:

- `mathAssist_grade1Progress`
- `mathAssist_grade2Progress`

Loading schema v1 preserves completed and review IDs, the latest mission, Grade
2's selected unit, skill summaries, onboarding state, and the last-played time.
Each old completed mission receives inferred baseline mastery and 10 XP. New
fields are `xp`, `learningDates`, `solvedVariantKeys`, and
`masteryByMissionId`. Malformed records continue to use the prior safe recovery
path.

## Verification Gate

The 2026-07-18 implementation passed:

- `npm run validate:grade1`: 96 templates
- `npm run validate:grade2`: 144 templates
- `npm run audit:missions`: 0 errors, 0 warnings
- `npm test`: 91 passed
- `npm run lint`
- `npm run tdd:guard`
- `npm run build`
- `PLAYWRIGHT_PORT=3135 npm run test:e2e`: 13 passed
- required game-client screenshot and text-state checks for both grades, with no
  captured console errors

Visual QA changed Grade 2's 12-mission unit list to a tablet-friendly two-column
grid. Keep browser checks in the loop when mission volume or reward cards change.
