# Workstream 02 - Learning Loop

## Owns

- `src/app/practice/**`
- `src/app/result/**`
- `src/lib/session.ts`
- future progress modules such as `src/lib/progress.ts`

## Focus

- mastery tracking
- retry loops
- action-first result screens
- next-step recommendations
- learner goal setting and reflection

## Typical tasks

- add concept mastery state
- add wrong-answer retry mode
- add result coaching copy
- connect practice history to future recommendations
- add Grade 1 island unlock, completion, and review-needed progress

## Watch-outs

- Shared output models must stay aligned with `src/lib/types.ts`.
- Practice flow changes should be paired with E2E updates.
- Grade 1 progress must stay localStorage-only and should not add server state.
